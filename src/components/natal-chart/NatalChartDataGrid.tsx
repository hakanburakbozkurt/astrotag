import type {
  Aspect,
  MinorPointPosition,
  NatalChartData,
  PlanetPosition,
} from "@/lib/astrology/types";
import { formatDegreeMinutes } from "@/lib/astrology/natal-master-data";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";

type NatalChartDataGridProps = {
  planets: PlanetPosition[];
  minorPoints: MinorPointPosition[];
  aspects: Aspect[];
};

function bodyName(
  id: string,
  planets: PlanetPosition[],
  minorPoints: MinorPointPosition[]
): string {
  return (
    planets.find((planet) => planet.id === id)?.name ??
    minorPoints.find((point) => point.id === id)?.name ??
    id
  );
}

export default function NatalChartDataGrid({
  planets,
  minorPoints,
  aspects,
}: NatalChartDataGridProps) {
  const rows = [
    ...planets.map((planet) => ({
      key: planet.id,
      symbol: planet.symbol,
      name: planet.name,
      degree: formatDegreeMinutes(planet.degreeInSign),
      sign: planet.signName,
      house: `${planet.house}. Ev`,
      kind: "Gezegen",
    })),
    ...minorPoints.map((point) => ({
      key: point.id,
      symbol: point.symbol,
      name: point.name,
      degree: formatDegreeMinutes(point.degreeInSign),
      sign: point.signName,
      house: `${point.house}. Ev`,
      kind: point.category === "outer" ? "Dış Gezegen" : "Nokta",
    })),
  ];

  return (
    <div className="w-full space-y-3">
      <CollapsiblePanel title="Gezegen & Nokta Tablosu" defaultOpen={false}>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[520px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-[0.18em] text-white/40">
                <th className="px-3 py-2.5 font-medium">Nokta</th>
                <th className="px-3 py-2.5 font-medium">Derece</th>
                <th className="px-3 py-2.5 font-medium">Burç</th>
                <th className="px-3 py-2.5 font-medium">Ev</th>
                <th className="px-3 py-2.5 font-medium">Tür</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-2.5 text-white/85">
                    <span className="text-amber-200/90">{row.symbol}</span> {row.name}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-amber-100/80">{row.degree}</td>
                  <td className="px-3 py-2.5 text-white/70">{row.sign}</td>
                  <td className="px-3 py-2.5 text-white/60">{row.house}</td>
                  <td className="px-3 py-2.5 text-white/45">{row.kind}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel title="Aspect Grid" defaultOpen={false}>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[480px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-[0.18em] text-white/40">
                <th className="px-3 py-2.5 font-medium">A</th>
                <th className="px-3 py-2.5 font-medium">Açı</th>
                <th className="px-3 py-2.5 font-medium">B</th>
                <th className="px-3 py-2.5 font-medium">Orb</th>
              </tr>
            </thead>
            <tbody>
              {aspects.map((aspect) => (
                <tr
                  key={aspect.id}
                  className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-2.5 text-white/75">
                    {bodyName(aspect.planetA, planets, minorPoints)}
                  </td>
                  <td className="px-3 py-2.5 text-white/85">
                    <span
                      className={
                        aspect.isMinor
                          ? "text-white/55"
                          : "font-medium text-amber-100/90"
                      }
                    >
                      {aspect.typeLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-white/75">
                    {bodyName(aspect.planetB, planets, minorPoints)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-white/50">
                    {aspect.orb.toFixed(2)}°
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsiblePanel>
    </div>
  );
}

export function NatalChartDataGridFromData({
  data,
}: {
  data: NatalChartData;
}) {
  return (
    <NatalChartDataGrid
      planets={data.planets}
      minorPoints={data.minorPoints}
      aspects={data.extendedAspects}
    />
  );
}
