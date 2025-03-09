import { NextResponse } from "next/server";
import { addDays, format, parseISO, isValid } from "date-fns";
import Holidays from "date-holidays";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseDate = searchParams.get("baseDate");
  const ruleParam = searchParams.get("rule");
  const rule = parseInt(ruleParam || "", 10);
  const state = searchParams.get("state")?.toUpperCase();
  const customHoliday = searchParams.get("customHoliday");
  const considerSaturdays = searchParams.get("considerSaturdays") === "true";

  // Validação de entrada
  if (!baseDate || !isValid(parseISO(baseDate))) {
    return NextResponse.json(
      { error: "Use uma data válida no formato YYYY-MM-DD" },
      { status: 400 }
    );
  }
  if (isNaN(rule) || rule < 1) {
    return NextResponse.json(
      { error: "A regra deve ser um número positivo" },
      { status: 400 }
    );
  }
  const validStates = [
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
  if (state && !validStates.includes(state)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  let currentDate = parseISO(baseDate);
  const explanation: string[] = [];
  const analyzedHolidays = new Map<string, string>();
  let totalDaysSkipped = 0;

  // const hd = state ? new Holidays(`BR-${state}`) : new Holidays("BR");

  const hd = new Holidays("BR");
  if (state) {
    hd.init("BR", state); // Configuração correta para estados
  }
  let countedDays = 0;

  while (countedDays < rule) {
    const currentDateStr = format(currentDate, "yyyy-MM-dd");
    const dayOfWeek = currentDate.getDay();
    const isWeekend =
      dayOfWeek === 0 || (dayOfWeek === 6 && !considerSaturdays);

    let holidayName = "";
    let isHoliday = false;

    const holidayInfo = hd.isHoliday(currentDate);
    if (holidayInfo) {
      let validHoliday;
      if (Array.isArray(holidayInfo)) {
        validHoliday = holidayInfo.find(
          (h) =>
            h.type &&
            !h.type.includes("optional") &&
            !h.type.includes("observance")
        );
      }

      if (validHoliday) {
        isHoliday = true;
        holidayName = validHoliday.name;
      }
    }

    // Verifica feriado personalizado
    if (customHoliday && customHoliday === currentDateStr) {
      isHoliday = true;
      holidayName = "Feriado Personalizado";
    }

    if (!isWeekend && !isHoliday) {
      countedDays++;
    } else {
      let motivo = "";
      if (isWeekend) {
        motivo = dayOfWeek === 0 ? "Domingo" : "Sábado";
      }
      if (isHoliday) {
        motivo = holidayName || "Feriado";
        if (!analyzedHolidays.has(currentDateStr)) {
          analyzedHolidays.set(format(currentDate, "dd/MM/yyyy"), holidayName);
        }
      }
      explanation.push(` ${format(currentDate, "dd/MM/yyyy")}: ${motivo}`);
      totalDaysSkipped++;
    }

    if (countedDays === rule) break;
    currentDate = addDays(currentDate, 1);
  }

  if (currentDate.getDay() === 6) {
    explanation.push(
      ` ${format(
        currentDate,
        "dd/MM/yyyy"
      )}: Sábado. O pagamento é previsto para ser adiantado para sexta-feira.`
    );
    currentDate = addDays(currentDate, -1);
  }
  return NextResponse.json({
    dataPagamento: format(currentDate, "dd/MM/yyyy"),
    feriadosConsiderados: Array.from(analyzedHolidays.entries()).map(
      ([date, name]) => `${name} (${format(date, "dd/MM/yyyy")})`
    ),
    explicacao: explanation,
    totalDaysSkipped,
    detalhes: {
      estado: state || "Nenhum",
      fonteFeriados: "date-holidays",
    },
  });
}
