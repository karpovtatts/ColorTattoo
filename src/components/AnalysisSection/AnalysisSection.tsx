import type { ColorAnalysis, Color } from '@/types'
import { TemperatureIndicator } from '@/components'
import './AnalysisSection.css'

interface AnalysisSectionProps {
  analysis: ColorAnalysis
  resultColor: Color
}

function AnalysisSection({ analysis, resultColor }: AnalysisSectionProps) {
  return (
    <div className="analysis-section">
      <div className="analysis-section__content">
        <div className="analysis-section__item">
          <span className="analysis-section__label">Чистота:</span>
          <span
            className={`analysis-section__value analysis-section__value--${
              analysis.isClean ? 'clean' : 'dirty'
            }`}
          >
            {analysis.isClean ? '✓ Чистый' : '⚠ Грязный'}
          </span>
        </div>
        <div className="analysis-section__item">
          <span className="analysis-section__label">Температура:</span>
          <TemperatureIndicator color={resultColor} size="medium" />
        </div>
        {analysis.explanations.length > 0 && (
          <div className="analysis-section__explanations">
            {analysis.explanations.map((explanation, idx) => (
              <p key={idx} className="analysis-section__explanation">
                {explanation}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalysisSection

