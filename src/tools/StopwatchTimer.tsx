import { useState, useEffect } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("stopwatch-timer")!;

export default function StopwatchTimer() {
  const { isAr, t } = useI18n();
  const [mode, setMode] = useState<"stopwatch" | "timer">("stopwatch");
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [timerInput, setTimerInput] = useState({ hours: 0, minutes: 5, seconds: 0 });

  useEffect(() => {
    let interval: number | undefined;
    if (isRunning) {
      interval = window.setInterval(() => {
        setTime((prev) => {
          if (mode === "timer" && prev <= 100) {
            setIsRunning(false);
            return 0;
          }
          return mode === "stopwatch" ? prev + 100 : prev - 100;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(2, "0")}`;
  };

  const startTimer = () => {
    const totalMs = (timerInput.hours * 3600 + timerInput.minutes * 60 + timerInput.seconds) * 1000;
    setTime(totalMs);
    setIsRunning(true);
  };

  const reset = () => {
    setTime(0);
    setIsRunning(false);
    setLaps([]);
  };

  const addLap = () => {
    setLaps([...laps, time]);
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("stopwatch")}
            className={`btn flex-1 ${mode === "stopwatch" ? "btn-primary" : "btn-secondary"}`}
          >
            {t("ساعة إيقاف", "Stopwatch")}
          </button>
          <button
            onClick={() => setMode("timer")}
            className={`btn flex-1 ${mode === "timer" ? "btn-primary" : "btn-secondary"}`}
          >
            {t("مؤقت", "Timer")}
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="font-mono text-5xl font-bold mb-4">{formatTime(time)}</div>
          
          {mode === "timer" && !isRunning && time === 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div>
                <label className="text-xs c-muted">{t("ساعات", "Hours")}</label>
                <input
                  type="number"
                  value={timerInput.hours}
                  onChange={(e) => setTimerInput({ ...timerInput, hours: Number(e.target.value) })}
                  className="input text-center"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs c-muted">{t("دقائق", "Minutes")}</label>
                <input
                  type="number"
                  value={timerInput.minutes}
                  onChange={(e) => setTimerInput({ ...timerInput, minutes: Number(e.target.value) })}
                  className="input text-center"
                  min={0}
                  max={59}
                />
              </div>
              <div>
                <label className="text-xs c-muted">{t("ثواني", "Seconds")}</label>
                <input
                  type="number"
                  value={timerInput.seconds}
                  onChange={(e) => setTimerInput({ ...timerInput, seconds: Number(e.target.value) })}
                  className="input text-center"
                  min={0}
                  max={59}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            {mode === "stopwatch" ? (
              <>
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`btn ${isRunning ? "btn-secondary" : "btn-primary"}`}
                >
                  <Icon name={isRunning ? "pause" : "play"} size={16} />
                  {isRunning ? t("إيقاف", "Pause") : t("بدء", "Start")}
                </button>
                {isRunning && (
                  <button onClick={addLap} className="btn btn-secondary">
                    {t("جولة", "Lap")}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={isRunning ? () => setIsRunning(false) : startTimer}
                className={`btn ${isRunning ? "btn-secondary" : "btn-primary"}`}
              >
                <Icon name={isRunning ? "pause" : "play"} size={16} />
                {isRunning ? t("إيقاف", "Pause") : t("بدء", "Start")}
              </button>
            )}
            <button onClick={reset} className="btn btn-secondary">
              <Icon name="refresh" size={16} />
              {t("إعادة", "Reset")}
            </button>
          </div>
        </div>

        {laps.length > 0 && (
          <div className="border-t border-[var(--line)] pt-4">
            <h4 className="font-bold mb-2">{t("الجولات", "Laps")}</h4>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {laps.map((lap, idx) => (
                <div key={idx} className="flex justify-between font-mono text-sm">
                  <span>{t("جولة", "Lap")} {idx + 1}</span>
                  <span>{formatTime(lap)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
