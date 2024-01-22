import { ChartType } from "chart.js";
import { TextAnalysis, generateChartData } from "../kanji";
import { RefObject } from "react";
import { saveAs } from "file-saver";
import "./ChartSettings.css"

export type SourceUnit = "unique" | "total" | "unique-percent" | "total-percent";
export type ScalePosition = "none" | "left" | "right";
export type AxisType = "delta" | "total";

export interface AxisSettings {
    enabled: boolean,
    position: ScalePosition,
    unit: SourceUnit,
    displayType: ChartType,
    color: string,
}

export interface ChartSettings {
    title: string;
    displayLegend: boolean,
    delta: AxisSettings;
    total: AxisSettings;
}

export function getDefaultSettings(): ChartSettings {
    // For colors, we're using default chart.js colors
    // They're copy-pasted to keep consistency (total blue, delta red)

    return {
        title: "",
        displayLegend: true,
        delta: {
            enabled: true,
            position: "left",
            displayType: "line",
            unit: "unique",
            color: "#ff6384", 
        },
        total: {
            enabled: true,
            position: "right",
            displayType: "bar",
            unit: "unique-percent",
            color: "#36a2eb",
        },
    }
}

export function ChartSettingsPanels(p: {
    canvasRef: RefObject<HTMLCanvasElement>,
    textAnalysis: TextAnalysis,
    settings: ChartSettings,
    onSettingsChange: (s: ChartSettings) => void,
}) {
    return <div id="chart-settings">
        <GeneralSettings settings={p.settings} onSettingsChange={p.onSettingsChange} />
        <AxisSettings settings={p.settings} onSettingsChange={p.onSettingsChange} axisName="delta" />
        <AxisSettings settings={p.settings} onSettingsChange={p.onSettingsChange} axisName="total" />
        <ExportPanel textAnalysis={p.textAnalysis} canvasRef={p.canvasRef} />
    </div>
}

function GeneralSettings(p: {
    settings: ChartSettings,
    onSettingsChange: (s: ChartSettings) => void,
}) {
    return <div className="chart-setting-panel">
        <h2>Chart settings</h2>
        <button id="reset-settings" onClick={() => p.onSettingsChange(getDefaultSettings())}>
            Reset to defaults
        </button>
    
        <label>
            Chart title
            <input
                type="text"
                placeholder="Title (optional)"
                value={p.settings.title}
                onChange={e => {
                    const newSettings = structuredClone(p.settings);
                    newSettings.title = e.target.value;
                    p.onSettingsChange(newSettings);
                }}
            />
        </label>

        <label>
            Display legend
            <input
                type="checkbox"
                checked={p.settings.displayLegend}
                onChange={e => {
                    const newSettings = structuredClone(p.settings);
                    newSettings.displayLegend = e.target.checked;
                    p.onSettingsChange(newSettings);
                }}
            />
        </label>
    </div>;
}

function AxisSettings(p: {
    settings: ChartSettings,
    onSettingsChange: (s: ChartSettings) => void,
    axisName: AxisType,
}) {
    const axisDescriptions = {
        delta: {
            title: "Contribution kanji axis",
            description:
                "This axis displays the change in amount of known kanji. " +
                "In other words, the more relevant kanji you learn during a level, the higher its value " +
                "on the chart.",
        },
        total: {
            title: "Total kanji axis",
            description: "This axis displays the total amount of kanji accumulated at the level.",
        },
    };

    const axisSettings = p.settings[p.axisName];

    // This could be massively improved to use some generic TypeScript hell,
    // but I just want to be done with this codebase lol
    const updateAxisSetting = (e: any, setting: string, elementProp: string) => {
        const newSettings = structuredClone(p.settings);
        (newSettings[p.axisName] as any)[setting] = e.target[elementProp];
        p.onSettingsChange(newSettings);
    };

    return <div className="chart-setting-panel">
        <h2>{axisDescriptions[p.axisName].title}</h2>
        <label>
            Enabled
            <input
                type="checkbox"
                checked={axisSettings.enabled}
                onChange={e => updateAxisSetting(e, "enabled", "checked")}
            />
        </label>
        <div>
            <label>Y scale position</label>
            <select
                value={axisSettings.position}
                onChange={e => updateAxisSetting(e, "position", "value")}
            >
                <option value="none">None</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
            </select>
        </div>
        <div>
            <label>Unit type</label>
            <select
                value={axisSettings.unit}
                onChange={e => updateAxisSetting(e, "unit", "value")}
            >
                <option value="unique-percent">Unique kanji by % of total</option>
                <option value="total-percent">Kanji occurrences by % of total</option>
                <option value="unique">Total unique kanji</option>
                <option value="total">Total kanji occurrences</option>
            </select>
        </div>
        <div>
            <label>Display as</label>
            <select
                value={axisSettings.displayType}
                onChange={e => updateAxisSetting(e, "displayType", "value")}
            >
                <option value="bar">Bar</option>
                <option value="line">Line</option>
            </select>
        </div>
        <div>
            <label>Color</label>
            <input
                type="color"
                value={axisSettings.color}
                onChange={e => updateAxisSetting(e, "color", "value")}
            />
            <button onClick={() => {
                const newSettings = structuredClone(p.settings);
                newSettings[p.axisName].color = getDefaultSettings()[p.axisName].color;
                p.onSettingsChange(newSettings);
            }}>Reset</button>
        </div>
        <p>{axisDescriptions[p.axisName].description}</p>
    </div>
}

function ExportPanel(p: {
    textAnalysis: TextAnalysis,
    canvasRef: RefObject<HTMLCanvasElement>,
}) {
    const pngExport = () => {
        const canvas = p.canvasRef.current;
        if (canvas === null) {
            console.error("empty canvasRef");
            return;
        }
        canvas.toBlob(blob => saveAs(blob!, "kanji-chart.png"));
    };

    const csvExport = () => {
        const analysis = p.textAnalysis;
        
        const total = generateChartData(analysis, "total", "total");
        const totalPercent = generateChartData(analysis, "total-percent", "total");
        const unique = generateChartData(analysis, "unique", "total");
        const uniquePercent = generateChartData(analysis, "unique-percent", "total");
        
        let finalString = "level,totalKanji,totalPercentage,uniqueKanji,uniquePercentage\n";
        for (let i = 0; i < 60; i++) {
            finalString += `${i + 1},${total[i]},${totalPercent[i].toFixed(2)},${unique[i]},${uniquePercent[i].toFixed(2)}\n`;
        }

        saveAs(new Blob([finalString], { type: "text/csv;charset=utf-8" }), "kanji-info.csv");
    };

    return <div className="chart-setting-panel">
        <h2>Chart export</h2>
        <ul>
            <li><a href="#" onClick={pngExport} title="Export as a PNG file">PNG export</a></li>
            <li><a href="#" onClick={csvExport} title="Export kanji info as a CSV file">CSV export</a></li>
        </ul>
    </div>
}
