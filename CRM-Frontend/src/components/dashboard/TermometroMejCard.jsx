import { RefreshCw, Thermometer } from 'lucide-react'

const formatColetaDateTime = (value) => {
  if (!value) return 'Ainda não sincronizado'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const getProgressToneClass = (percentual) => {
  if (percentual >= 100) return 'isSuccess'
  if (percentual >= 50) return 'isProgress'
  return 'isWarm'
}

function TermometroMejCard({
  termometro,
  loading,
  syncing,
  syncError,
  isAdmin,
  onSync,
}) {
  const ano = termometro?.ano ?? new Date().getFullYear()
  const disponivel = Boolean(termometro?.disponivel)
  const percentual = Number(termometro?.percentual ?? 0)
  const clampedPercentual = Math.max(0, Math.min(100, percentual))
  const toneClass = getProgressToneClass(percentual)
  const limiteDiario = Number(termometro?.limiteSincronizacoesDia ?? 2)
  const restantesHoje =
    termometro?.sincronizacoesRestantesHoje !== undefined
      ? Number(termometro.sincronizacoesRestantesHoje)
      : limiteDiario
  const limitReached = restantesHoje <= 0

  return (
    <section className="panel termometroPanel" aria-labelledby="termometro-mej-title">
      <div className="termometroHeader">
        <div className="termometroTitleGroup">
          <span className="termometroIcon" aria-hidden="true">
            <Thermometer size={20} />
          </span>
          <div>
            <h2 id="termometro-mej-title">Termômetro MEJ · Faturamento {ano}</h2>
            <p className="termometroSubtitle">
              Acompanhamento da meta anual no Portal Brasil Júnior
            </p>
          </div>
        </div>

        <div className="termometroActions">
          {disponivel && (
            <span className={`tag ${percentual >= 100 ? 'ok' : percentual >= 50 ? 'admin' : 'task'}`}>
              {percentual.toFixed(1).replace('.', ',')}% da meta
            </span>
          )}
          {isAdmin && (
            <>
              <span className="termometroSyncQuota">
                {limitReached
                  ? `Limite diário atingido (${limiteDiario}/${limiteDiario})`
                  : `${restantesHoje}/${limiteDiario} sinc. restantes hoje`}
              </span>
              <button
                type="button"
                className="secondaryBtn termometroSyncBtn"
                onClick={onSync}
                disabled={syncing || loading || limitReached}
                title={
                  limitReached
                    ? 'Limite diário de 2 sincronizações atingido'
                    : 'Sincronizar dados com o Portal Brasil Júnior'
                }
              >
                <RefreshCw size={15} className={syncing ? 'termometroSpin' : ''} />
                {syncing
                  ? 'Sincronizando...'
                  : limitReached
                    ? 'Limite diário atingido'
                    : 'Sincronizar agora'}
              </button>
            </>
          )}
        </div>
      </div>

      {syncError && (
        <p className="formError" role="status" aria-live="polite">
          {syncError}
        </p>
      )}

      {loading && !termometro ? (
        <p className="tableMessage">Carregando Termômetro MEJ...</p>
      ) : !disponivel ? (
        <div className="termometroEmpty">
          <p>Nenhuma leitura do Portal Brasil Júnior foi salva até o momento.</p>
          <small>
            Os dados são atualizados automaticamente pela rotina agendada.
            {termometro?.ultimoStatusColeta === 'ERRO' && termometro?.ultimoErro
              ? ` Última tentativa falhou: ${termometro.ultimoErro}`
              : ''}
          </small>
        </div>
      ) : (
        <>
          <div className="termometroProgressWrap">
            <progress
              className={`termometroProgress ${toneClass}`}
              value={clampedPercentual}
              max={100}
              aria-labelledby="termometro-mej-title"
            />
            <div className="termometroScale">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="termometroMetrics">
            <div className="termometroMetricItem">
              <span>Alcançado</span>
              <strong className="termometroValueAlcancado">{termometro.alcancadoFormatado}</strong>
            </div>
            <div className="termometroMetricItem">
              <span>Meta</span>
              <strong>{termometro.metaFormatada}</strong>
            </div>
            <div className="termometroMetricItem">
              <span>Gap</span>
              <strong className="termometroValueGap">{termometro.gapFormatado}</strong>
            </div>
          </div>

          <div className="termometroFooter" role="status" aria-live="polite">
            <span>Última atualização: {formatColetaDateTime(termometro.coletadoEm)}</span>
            {termometro.ultimoStatusColeta === 'ERRO' && termometro.ultimoErro && (
              <span className="termometroWarn">
                Última tentativa de atualização falhou (exibindo último valor salvo).
              </span>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default TermometroMejCard

