import { TextAnalysis } from "../kanji";
import "./InputForm.css"
import { useState } from "react";

export default function InputForm(p: {
    defaultInput: string,
    textAnalysis: TextAnalysis,
    onChange: (v: string) => void
}) {
    const hasKanji = p.textAnalysis.totalKanjiOccurrences > 0;

    return <form id="input-form">
        <div id="input-form-flexbox">
            <div id="input-form-left">
                <textarea
                    id="input-text"
                    defaultValue={p.defaultInput}
                    onChange={e => p.onChange(e.target.value)}
                    placeholder="Japanese goes here..."
                    lang="ja"
                    onDragOver={e => {
                        e.preventDefault();
                    }}
                    onDrop={async e => {
                        // Not sure why I need to handle those two different cases, but eh
                        const files = e.dataTransfer.items.length === 0
                            ? Array.from(e.dataTransfer.files)
                            : Array.from(e.dataTransfer.items)
                                .filter(item => item.kind === "file")
                                .map(item => item.getAsFile() as File);
                        
                        // TODO: Support non UTF-8 files
                        // File.text() can only parse UTF-8
                        const completeInput = await Promise.all(files.map(f => f.text()));
                        
                        const textArea = e.target as HTMLTextAreaElement;
                        const newText = completeInput.reduce(
                            (accum, current) => accum + current,
                            textArea.value
                        );
                            
                        textArea.value = newText;
                        p.onChange(newText);
                    }}
                ></textarea>
            </div>
            <div id="input-form-right">
                {hasKanji ? (
                    <TextMetrics textAnalysis={p.textAnalysis} />
                ) : (
                    <div id="metric-no-kanji">
                        No kanji in the input. Huh.
                    </div>
                )}
            </div>
        </div>
        <i>
            <b>Tip:</b> You can paste in entire bodies of written text, the generator extracts all kanji
            out of it. You can also drag and drop text files into the field to automatically append them
            to the text box. The text files must be UTF-8 encoded, otherwise you may get corrupted input.
        </i>
    </form>;
}

function TextMetrics(p: { textAnalysis: TextAnalysis }) {
    const [wkLevel, setWkLevel] = useState(1);

    const ta = p.textAnalysis;
    const totalKanji = ta.totalUniqueKanji;
    const levelKanji = ta.perWkLevel
        .slice(0, wkLevel)
        .map(kanjiList => kanjiList.length)
        .reduce((accum, levelLength) => accum + levelLength, 0);
    const aboveLevelKanji = ta.perWkLevel
        .slice(wkLevel)
        .map(kanjiList => kanjiList.length)
        .reduce((accum, levelLength) => accum + levelLength, 0);
    const outsideWkKanji = ta.outsideWk.length;

    const calcPercentage = (kanjiCount: number) => {
        return (kanjiCount / totalKanji * 100).toFixed(1);
    };

    return <div id="metric-panel">
        Total kanji: {p.textAnalysis.totalKanjiOccurrences}<br />
        Total unique kanji: {p.textAnalysis.totalUniqueKanji}<br /><br />

        <label>
            Your WaniKani level:<br />
            <input
                type="number"
                min="1"
                max="60"
                value={wkLevel}
                onChange={e => setWkLevel(parseInt(e.target.value))}
            /><br />
        </label>

        Learned kanji: {levelKanji} ({calcPercentage(levelKanji)}%)<br />
        Kanji above level: {aboveLevelKanji} ({calcPercentage(aboveLevelKanji)}%)<br />
        Kanji outside WaniKani: {outsideWkKanji} ({calcPercentage(outsideWkKanji)}%)<br />
    </div>;
}
