"use client";
import Footer from "@/components/footer";
import { useState, useEffect } from "react";
import { FaCalendarAlt } from "react-icons/fa";

const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const parsePaymentDate = (dateString: string): Date | null => {
  const [day, month, year] = dateString.split("/").map(Number);
  const parsedDate = new Date(year, month - 1, day);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const AnimatedNumber = ({ value }: { value: number }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (value !== prevValue) {
      setPrevValue(value);
      setKey((prev) => prev + 1);
    }
  }, [value, prevValue]);

  return (
    <div className="relative h-8 overflow-hidden">
      <div key={key} className="animate-slideIn absolute inset-0">
        {value}
      </div>
      {value !== prevValue && (
        <div className="animate-slideOut absolute inset-0">{prevValue}</div>
      )}
    </div>
  );
};

export default function Page() {
  const [baseDate, setBaseDate] = useState(() => {
    const today = new Date();
    // Para obter sempre o 1º dia do mês atual, defina o dia como 1
    today.setDate(1);

    return today.toISOString().split("T")[0];
  });

  const [rulePreset, setRulePreset] = useState("5");
  const [customRule, setCustomRule] = useState("");
  const [state, setState] = useState("");
  const [result, setResult] = useState<{
    error?: string;
    dataPagamento?: string;
    feriadosConsiderados?: string[];
    explicacao?: string[];
    totalDaysSkipped?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [showCustomHoliday, setShowCustomHoliday] = useState(false);
  const [customHoliday, setCustomHoliday] = useState("");
  const [considerSaturdays, setConsiderSaturdays] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (result?.dataPagamento) {
      const paymentDate = parsePaymentDate(result.dataPagamento);

      if (!paymentDate) {
        setTimeRemaining(null);
        return;
      }

      paymentDate.setHours(23, 59, 59, 999);

      const updateTimer = () => {
        const now = new Date();
        const diff = paymentDate.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining(null);
          return;
        }

        setTimeRemaining({
          days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
          hours: Math.max(
            0,
            Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          ),
          minutes: Math.max(
            0,
            Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          ),
          seconds: Math.max(0, Math.floor((diff % (1000 * 60)) / 1000)),
        });
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [result]);

  const isCalculateDisabled = () => {
    return (
      rulePreset === "custom" &&
      (!customRule || isNaN(parseInt(customRule)) || parseInt(customRule) < 1)
    );
  };

  const handleCalculate = async () => {
    if (!baseDate) {
      setResult({ error: "Selecione uma data base!" });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        baseDate,
        rule: rulePreset === "custom" ? customRule : rulePreset,
        ...(state && { state }),
        ...(customHoliday && { customHoliday }),
        considerSaturdays: considerSaturdays.toString(),
      });

      const response = await fetch(`/api/v1/calculate?${params}`);
      const data = await response.json();

      if (data.error) {
        setResult({ error: data.error });
      } else {
        const isValidDate = !!parsePaymentDate(data.dataPagamento);
        setResult({
          dataPagamento: isValidDate ? data.dataPagamento : "Data inválida",
          feriadosConsiderados: data.feriadosConsiderados,
          explicacao: data.explicacao,
          totalDaysSkipped: data.totalDaysSkipped,
        });
      }

      setAnimationKey((prev) => prev + 1);
    } catch {
      setResult({ error: "Erro ao conectar com o servidor" });
    } finally {
      setLoading(false);
    }
  };

  const paymentDate = result?.dataPagamento
    ? parsePaymentDate(result.dataPagamento)
    : null;
  const today = new Date();
  const isPaymentToday =
    paymentDate && paymentDate.toDateString() === today.toDateString();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 max-w-2xl mx-auto bg-background">
      <div className="w-full space-y-6 bg-background shadow-lg p-8 rounded-2xl border border-foreground/10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground animate-bounce">
            Pagômetro 💸
          </h1>
          <p className="text-foreground/70">
            📅 Medição precisa | 🚧 Feriados bloqueados | 🎯 Data certa
          </p>
        </div>

        <div className="w-full space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Data Base 📅
            </label>
            <div className="relative">
              <input
                type="date"
                className="w-full p-3 pl-10 rounded-lg border border-foreground/20 focus:ring-2 focus:ring-foreground"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
              <FaCalendarAlt className="absolute left-3 top-3.5 text-foreground/50" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Dias Úteis
            </label>
            <select
              className="w-full p-3 rounded-lg border border-foreground/20 focus:ring-2 focus:ring-foreground"
              value={rulePreset}
              onChange={(e) => setRulePreset(e.target.value)}
            >
              <option value="5">5º dia útil</option>
              <option value="10">10º dia útil</option>
              <option value="15">15º dia útil</option>
              <option value="custom">Outro</option>
            </select>
            {rulePreset === "custom" && (
              <input
                type="number"
                className="w-full p-3 mt-2 rounded-lg border border-foreground/20 focus:ring-2 focus:ring-foreground"
                placeholder="Digite a quantidade de dias úteis"
                value={customRule}
                onChange={(e) => setCustomRule(e.target.value)}
                min="1"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Estado (UF)
            </label>
            <select
              className="w-full p-3 rounded-lg border border-foreground/20 focus:ring-2 focus:ring-foreground uppercase"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">Selecione um estado</option>
              {BRAZILIAN_STATES.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox text-foreground"
                checked={considerSaturdays}
                onChange={(e) => setConsiderSaturdays(e.target.checked)}
              />
              <span className="ml-2 text-foreground">
                Considerar sábados como dia útil
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setShowCustomHoliday(!showCustomHoliday)}
              className="w-full p-2 bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20 transition"
            >
              {showCustomHoliday ? "Ocultar Feriado" : "Adicionar Feriado"}
            </button>
            {showCustomHoliday && (
              <input
                type="date"
                className="w-full p-3 rounded-lg border border-foreground/20 focus:ring-2 focus:ring-foreground"
                value={customHoliday}
                onChange={(e) => setCustomHoliday(e.target.value)}
              />
            )}
          </div>

          <button
            onClick={handleCalculate}
            className="w-full p-3 bg-foreground text-background font-medium rounded-lg transition-all hover:bg-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || isCalculateDisabled()}
          >
            {loading ? "Calculando... 💸" : "Calcular Data"}
          </button>
        </div>

        {result?.error && (
          <div className="mt-4 p-4 bg-foreground/10 text-foreground rounded-lg border border-foreground/20 animate-shake">
            {result.error}
          </div>
        )}

        {result?.dataPagamento && (
          <div key={animationKey} className="mt-6 w-full space-y-4">
            <div
              className={`p-4 bg-foreground/10 text-foreground rounded-lg border border-foreground/20 ${
                isPaymentToday ? "animate-pulse" : ""
              }`}
            >
              <p className="font-semibold">
                📅 Data de Pagamento: {result.dataPagamento}{" "}
                {isPaymentToday && "🎉"}
              </p>
              <p className="font-semibold">
                ⏳ Total de dias pulados: {result.totalDaysSkipped}
              </p>
            </div>

            {timeRemaining && !isPaymentToday && (
              <div className="p-4 bg-foreground/10 text-foreground rounded-lg border border-foreground/20 animate-fade-in">
                <p className="font-medium mb-2">⏳ Tempo até o dia previsto:</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-background rounded-lg overflow-hidden">
                    <div className="text-2xl font-bold">
                      <AnimatedNumber value={timeRemaining.days} />
                    </div>
                    <div className="text-sm">dias</div>
                  </div>
                  <div className="p-2 bg-background rounded-lg overflow-hidden">
                    <div className="text-2xl font-bold">
                      <AnimatedNumber value={timeRemaining.hours} />
                    </div>
                    <div className="text-sm">horas</div>
                  </div>
                  <div className="p-2 bg-background rounded-lg overflow-hidden">
                    <div className="text-2xl font-bold">
                      <AnimatedNumber value={timeRemaining.minutes} />
                    </div>
                    <div className="text-sm">minutos</div>
                  </div>
                  <div className="p-2 bg-background rounded-lg overflow-hidden">
                    <div className="text-2xl font-bold">
                      <AnimatedNumber value={timeRemaining.seconds} />
                    </div>
                    <div className="text-sm">segundos</div>
                  </div>
                </div>
              </div>
            )}

            {(result.feriadosConsiderados ?? []).length > 0 && (
              <div className="p-4 bg-foreground/10 text-foreground rounded-lg border border-foreground/20 animate-fade-in">
                <p className="font-medium mb-2">🚫 Feriados excluídos:</p>
                <p className="text-sm mb-2 text-foreground/70">
                  Os seguintes feriados foram excluídos do cálculo:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  {result.feriadosConsiderados?.map((feriado, index) => (
                    <li key={index} className="text-sm">
                      {feriado}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(result.explicacao ?? []).length > 0 && (
              <div className="p-4 bg-foreground/10 text-foreground rounded-lg border border-foreground/20 animate-fade-in">
                <p className="font-medium mb-2">📝 Dias pulados:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {result.explicacao?.map((explicacao, index) => (
                    <li key={index} className="text-sm">
                      {explicacao}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Componente Footer */}
      <Footer />
    </main>
  );
}
