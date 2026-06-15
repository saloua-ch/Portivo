import { analyticsData } from "../data/mockData";
import { Package, TrendingUp, Clock, CheckCircle } from "lucide-react";

const { totalContainers, activeContainers, deliveredThisMonth, avgTransitDays, monthlyVolume, topClients } = analyticsData;

const maxVolume = Math.max(...monthlyVolume.map(m => m.count));

const statusBreakdown = [
  { label: "In transit",    count: 6, color: "#185FA5", bg: "#E6F1FB" },
  { label: "In customs",   count: 2, color: "#854F0B", bg: "#FAEEDA" },
  { label: "Arriving soon",count: 3, color: "#3B6D11", bg: "#EAF3DE" },
  { label: "Needs attention", count: 2, color: "#A32D2D", bg: "#FCEBEB" },
];

const totalBreakdown = statusBreakdown.reduce((s, r) => s + r.count, 0);

function MetricCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div style={{
      background: "#fff",
      border: "0.5px solid #e0e0e0",
      borderRadius: 12,
      padding: "20px 24px",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 8,
        background: bg, color: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14,
      }}>
        <Icon size={18} />
      </div>
      <p style={{ fontSize: 28, fontWeight: 500, color: "#1a1f36", margin: "0 0 4px" }}>
        {value}
      </p>
      <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1f36", margin: "0 0 2px" }}>
        {label}
      </p>
      <p style={{ fontSize: 12, color: "#8892b0", margin: 0 }}>
        {sub}
      </p>
    </div>
  );
}

export default function Analytics() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px", color: "#1a1f36" }}>
          Analytics
        </h1>
        <p style={{ fontSize: 14, color: "#8892b0", margin: 0 }}>
          Overview of operations — updated on each import.
        </p>
      </div>

      {/* Metric cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        marginBottom: 28,
      }}>
        <MetricCard
          icon={Package}
          label="Total containers"
          value={totalContainers}
          sub="All time"
          color="#185FA5" bg="#E6F1FB"
        />
        <MetricCard
          icon={TrendingUp}
          label="Active now"
          value={activeContainers}
          sub="In transit or customs"
          color="#854F0B" bg="#FAEEDA"
        />
        <MetricCard
          icon={CheckCircle}
          label="Delivered this month"
          value={deliveredThisMonth}
          sub="June 2026"
          color="#3B6D11" bg="#EAF3DE"
        />
        <MetricCard
          icon={Clock}
          label="Avg. transit time"
          value={`${avgTransitDays}d`}
          sub="Last 3 months"
          color="#534AB7" bg="#EEEDFE"
        />
      </div>

      {/* Chart + clients side by side */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.6fr 1fr",
        gap: 16,
        marginBottom: 16,
      }}>

        {/* Bar chart */}
        <div style={{
          background: "#fff",
          border: "0.5px solid #e0e0e0",
          borderRadius: 12,
          padding: "24px 24px 20px",
        }}>
          <p style={{
            fontSize: 14, fontWeight: 500, color: "#1a1f36",
            margin: "0 0 4px",
          }}>
            Monthly volume
          </p>
          <p style={{ fontSize: 12, color: "#8892b0", margin: "0 0 28px" }}>
            Containers handled per month, 2026
          </p>

          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            height: 160,
          }}>
            {monthlyVolume.map((m, i) => {
              const isLast = i === monthlyVolume.length - 1;
              const height = Math.round((m.count / maxVolume) * 140);
              return (
                <div
                  key={m.month}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <span style={{
                    fontSize: 11, color: isLast ? "#185FA5" : "#8892b0",
                    fontWeight: isLast ? 500 : 400,
                  }}>
                    {m.count}
                  </span>
                  <div style={{
                    width: "100%",
                    height: height,
                    background: isLast ? "#185FA5" : "#E6F1FB",
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.3s",
                  }} />
                  <span style={{
                    fontSize: 11,
                    color: isLast ? "#185FA5" : "#8892b0",
                    fontWeight: isLast ? 500 : 400,
                  }}>
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top clients */}
        <div style={{
          background: "#fff",
          border: "0.5px solid #e0e0e0",
          borderRadius: 12,
          padding: "24px 24px 20px",
        }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#1a1f36", margin: "0 0 4px" }}>
            Top clients
          </p>
          <p style={{ fontSize: 12, color: "#8892b0", margin: "0 0 24px" }}>
            By number of shipments
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {topClients.map((client, i) => {
              const maxClient = topClients[0].shipments;
              const pct = Math.round((client.shipments / maxClient) * 100);
              const colors = ["#185FA5","#3B6D11","#534AB7","#854F0B","#A32D2D"];
              const bgs   = ["#E6F1FB","#EAF3DE","#EEEDFE","#FAEEDA","#FCEBEB"];

              return (
                <div key={client.name}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 5,
                    alignItems: "center",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{
                        fontSize: 11, width: 18, height: 18,
                        borderRadius: "50%",
                        background: bgs[i], color: colors[i],
                        display: "inline-flex", alignItems: "center",
                        justifyContent: "center", fontWeight: 500,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 13, color: "#1a1f36" }}>{client.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#8892b0" }}>
                      {client.shipments}
                    </span>
                  </div>
                  <div style={{
                    height: 5, background: "#f0f0f0",
                    borderRadius: 3, overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: colors[i],
                      borderRadius: 3,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div style={{
        background: "#fff",
        border: "0.5px solid #e0e0e0",
        borderRadius: 12,
        padding: "24px 28px",
      }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#1a1f36", margin: "0 0 4px" }}>
          Current operations snapshot
        </p>
        <p style={{ fontSize: 12, color: "#8892b0", margin: "0 0 24px" }}>
          Live breakdown of all active containers
        </p>

        {/* Progress bar */}
        <div style={{
          display: "flex", height: 10,
          borderRadius: 6, overflow: "hidden",
          marginBottom: 20, gap: 2,
        }}>
          {statusBreakdown.map(s => (
            <div
              key={s.label}
              style={{
                flex: s.count,
                background: s.color,
                transition: "flex 0.3s",
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}>
          {statusBreakdown.map(s => (
            <div
              key={s.label}
              style={{
                padding: "14px 16px",
                background: s.bg,
                borderRadius: 10,
              }}
            >
              <p style={{
                fontSize: 22, fontWeight: 500,
                color: s.color, margin: "0 0 2px",
              }}>
                {s.count}
              </p>
              <p style={{ fontSize: 12, color: s.color, margin: "0 0 6px" }}>
                {s.label}
              </p>
              <p style={{ fontSize: 11, color: s.color, margin: 0, opacity: 0.7 }}>
                {Math.round((s.count / totalBreakdown) * 100)}% of active
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}