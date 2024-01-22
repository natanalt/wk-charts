import { useEffect, useRef, useState, RefObject } from "react";
import { TextAnalysis, generateChartData } from "../kanji";
import { ChartSettings, ChartSettingsPanels, getDefaultSettings } from "./ChartSettings"
import { Chart, registerables as chartRegisterables } from "chart.js";
import "./ChartArea.css"

export default function ChartArea(p: { textAnalysis: TextAnalysis }) {
    const [settings, setSettings] = useState(getDefaultSettings());
    const canvasRef = useRef<HTMLCanvasElement>(null);

    return <>
        <ChartDisplay
            canvasRef={canvasRef}
            textAnalysis={p.textAnalysis}
            settings={settings}
        />
        <ChartSettingsPanels
            textAnalysis={p.textAnalysis}
            canvasRef={canvasRef}
            settings={settings}
            onSettingsChange={setSettings}
        />
    </>
}

function ChartDisplay(p: {
    textAnalysis: TextAnalysis,
    settings: ChartSettings,
    canvasRef: RefObject<HTMLCanvasElement>,
}) {
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (chartRef.current === null) {
            // Not the most efficient thing, but I don't care
            // webdev do be webdev
            Chart.register(...chartRegisterables);

            chartRef.current = new Chart(p.canvasRef.current as HTMLCanvasElement, {
                data: {
                    labels: Array(60).fill(1).map((v, i) => `${v + i}`),
                    datasets: []
                },
                plugins: [{
                    id: "customCanvasBackgroundColor",
                    beforeDraw: chart => {
                        const { ctx } = chart;
                        ctx.save();
                        ctx.globalCompositeOperation = "destination-over";
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, chart.width, chart.height);
                        ctx.restore();
                    }
                }]
            });
        }
        const chart: Chart = chartRef.current;

        const settings = p.settings;
        const textAnalysis = p.textAnalysis;

        // pretend this doesn't exist
        chart.options = {
            animation: false,
            plugins: {
                title: {
                    display: settings.title.length > 0,
                    text: settings.title
                },
                tooltip: {
                    callbacks: {
                        title: context => {
                            return "Level " + context[0].label;
                        },
                        label: context => {
                            if (context.dataset.yAxisID === "yTotal") {
                                const value = context.dataset.data[context.dataIndex]! as number;
                                switch (settings.total.unit) {
                                    case "unique": {
                                        return `Total: ${value} of known unique kanji`;
                                    }
                                    case "total": {
                                        return `Total: ${value} of familiar kanji occurrences`;
                                    }
                                    case "unique-percent": {
                                        return `Total: ${value.toFixed(1)}% of known unique kanji`;
                                    }
                                    case "total-percent": {
                                        return `Total: ${value.toFixed(1)}% of familiar kanji occurrences`;
                                    }
                                }
                            } else if (context.dataset.yAxisID === "yDelta") {
                                const value = context.dataset.data[context.dataIndex]! as number;
                                switch (settings.delta.unit) {
                                    case "unique": {
                                        return `Contribution to total: ${value} of learned kanji`;
                                    }
                                    case "total": {
                                        return `Contribution to total: ${value} of familiar kanji occurrences`;
                                    }
                                    case "unique-percent": {
                                        return `Contribution to total: ${value.toFixed(1)} pp of learned kanji`;
                                    }
                                    case "total-percent": {
                                        return `Contribution to total: ${value.toFixed(1)} pp of familiar kanji occurrences`;
                                    }
                                }
                            }
                        }
                    }
                },
                legend: {
                    display: settings.displayLegend,
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 10,
                        }
                    }
                },
                yTotal: {
                    display: settings.total.position !== "none" && settings.total.enabled,
                    position: settings.total.position === "none" ? "left" : settings.total.position,
                    ticks: {
                        callback: value => {
                            if (settings.total.unit === "total-percent" || settings.total.unit === "unique-percent") {
                                return value + "%";
                            } else {
                                return value;
                            }
                        }
                    }
                },
                yDelta: {
                    display: settings.delta.position !== "none" && settings.delta.enabled,
                    position: settings.delta.position === "none" ? "left" : settings.delta.position,
                    grid: {
                        // Only draw the delta grid if total isn't present
                        drawOnChartArea: !settings.total.enabled,
                    },
                    ticks: {
                        callback: value => {
                            if (settings.delta.unit === "total-percent" || settings.delta.unit === "unique-percent") {
                                return value + " pp";
                            } else {
                                return value;
                            }
                        }
                    }
                }
            }
        };

        // TODO: Prevent constant number recalculations
        // Perhaps cache that in TextAnalysis?
        chart.data.datasets = [];
        if (settings.total.enabled) {
            let label: string;
            switch (settings.total.unit) {
                case "unique": {
                    label = "Total known unique kanji";
                    break;
                }
                case "total": {
                    label = "Total familiar kanji occurrences";
                    break;
                }
                case "unique-percent": {
                    label = "Total % of known unique kanji";
                    break;
                }
                case "total-percent": {
                    label = "Total % of familiar kanji occurrences";
                    break;
                }
            }

            chart.data.datasets.push({
                type: settings.total.displayType,
                label: label,
                data: generateChartData(textAnalysis, settings.total.unit, "total"),
                yAxisID: "yTotal",
                backgroundColor: settings.total.color + "80", // include 50% alpha
                borderColor: settings.total.color,
            });
        }
        if (settings.delta.enabled) {
            let label: string;
            switch (settings.delta.unit) {
                case "unique": {
                    label = "New unique kanji learned";
                    break;
                }
                case "total": {
                    label = "New unique kanji learned (all occurrences)";
                    break;
                }
                case "unique-percent": {
                    label = "% of new unique kanji learned";
                    break;
                }
                case "total-percent": {
                    label = "% of new unique kanji learned (all occurrences)";
                    break;
                }
            }

            chart.data.datasets.push({
                type: settings.delta.displayType,
                label: label, // think of a better name
                data: generateChartData(textAnalysis, settings.delta.unit, "delta"),
                yAxisID: "yDelta",
                backgroundColor: settings.delta.color + "80", // include 50% alpha
                borderColor: settings.delta.color,
            });
        }

        chart.update();
    });

    return <div>
        <canvas id="chart-canvas" ref={p.canvasRef}></canvas>
        <KanjiOutsideWk kanjiList={[...p.textAnalysis.outsideWk]} />
    </div>;
}

function KanjiOutsideWk(p: { kanjiList: string[] }) {
    return <p>
        Kanji outside WaniKani: <span lang="ja">{
            p.kanjiList
                .map((kanji, index) => {
                    const isLast = index === p.kanjiList.length - 1;
                    return <span key={kanji}>
                        <a
                            target="_blank"
                            href={`https://jisho.org/search/${kanji}%20%23kanji`}
                            title={`jisho.org page for kanji ${kanji}`}
                        >
                            {kanji}
                        </a>
                        {!isLast && "、"}
                    </span>
                })
        }</span>
    </p>
}
