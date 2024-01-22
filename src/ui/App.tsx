import InputForm from "./InputForm"
import ChartArea from "./ChartArea"
import { useState } from "react"
import defaultInput from "../data/default-input.txt?raw";
import { TextAnalysis, analyzeText } from "../kanji";

export default function App() {
    const [textAnalysis, setTextAnalysis] = useState<TextAnalysis>(analyzeText(defaultInput));

    function newTextInput(input: string) {
        setTextAnalysis(analyzeText(input));
    }

    return <>
        <InputForm textAnalysis={textAnalysis} defaultInput={defaultInput} onChange={newTextInput} />
        <ChartArea textAnalysis={textAnalysis} />
    </>
}
