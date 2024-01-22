import wkKanjiList from "./data/list-wk-kanji.json";
import allKanjiList from "./data/list-kanjidic.txt?raw";
import { AxisType, SourceUnit } from "./ui/ChartSettings";

export interface KanjiFrequency {
    occurrences: number;
    fraction: number;
    wkLevel: number | undefined;
}

export interface TextAnalysis {
    totalKanjiOccurrences: number;
    totalUniqueKanji: number;
    kanjiFrequency: Record<string, KanjiFrequency>;
    perWkLevel: string[];
    outsideWk: string;
}

export function analyzeText(input: string): TextAnalysis {
    let totalKanjiOccurrences = 0;
    let kanjiFrequency: Record<string, KanjiFrequency> = {};
    let totalUniqueKanji = 0;
    let perWkLevel = Array<string>(wkKanjiList.length).fill("");
    let outsideWk = "";

    for (const kanji of input) {
        const level = getWkLevel(kanji);

        if (level === "not-kanji") {
            continue;
        }

        totalKanjiOccurrences += 1;
        if (kanji in kanjiFrequency) {
            kanjiFrequency[kanji].occurrences += 1;
        } else {
            totalUniqueKanji += 1;
            kanjiFrequency[kanji] = {
                fraction: NaN, // will be updated later
                wkLevel: level,
                occurrences: 1,
            }
        }

        if (typeof(level) === "number") {
            if (!perWkLevel[level].includes(kanji)) {
                perWkLevel[level] += kanji;
            }
        } else {
            if (!outsideWk.includes(kanji)) {
                outsideWk += kanji;
            }
        }
    }

    for (const kanji in kanjiFrequency) {
        const frequency = kanjiFrequency[kanji];
        frequency.fraction = frequency.occurrences / totalKanjiOccurrences;
    }

    return {
        totalKanjiOccurrences: totalKanjiOccurrences,
        totalUniqueKanji: totalUniqueKanji,
        kanjiFrequency: kanjiFrequency,
        perWkLevel: perWkLevel,
        outsideWk: outsideWk,
    };
}

export function generateChartData(
    analysis: TextAnalysis,
    unit: SourceUnit,
    type: AxisType,
): number[] {
    let total: number;
    let rawCounts: number[];
    switch (unit) {
        case "total":
        case "total-percent": {
            total = analysis.totalKanjiOccurrences;
            rawCounts = analysis.perWkLevel.map(kanjiList => [...kanjiList]
                .map(kanji => analysis.kanjiFrequency[kanji].occurrences)
                .reduce((a, n) => a + n, 0)
            );
            break;
        }
        case "unique":
        case "unique-percent": {
            total = analysis.totalUniqueKanji;
            rawCounts = analysis.perWkLevel.map(kanjiList => kanjiList.length);
            break;
        }
    }

    if (type === "total") {
        let runningTotal = 0;
        rawCounts = rawCounts.map(count => {
            runningTotal += count;
            return runningTotal;
        });
    }

    if (unit === "total-percent" || unit === "unique-percent") {
        rawCounts = rawCounts.map(count => count / total * 100);
    }

    return rawCounts;
}

export function isKanji(string: string): boolean {
    const trimmed = string.trim();
    if (trimmed.length === 0) {
        return false;
    }
    return allKanjiList.includes(trimmed);
}

export function getWkLevel(string: string): number | undefined | "not-kanji" {
    if (!isKanji(string)) {
        return "not-kanji";
    }

    for (let i = 0; i < wkKanjiList.length; i++) {
        if (wkKanjiList[i].includes(string)) {
            return i;
        }
    }

    return undefined;
}
