import classNames from "classnames";
import type { Player } from "~/engine";
import { CANT_BUZZ_FLAG, CLUE_TIMEOUT_MS } from "~/engine";
import { stringToHslColor } from "~/utils/utils";

function durationMessage(durationMs?: number) {
  switch (durationMs) {
    case undefined:
      return "--";
    case CANT_BUZZ_FLAG:
      return "cannot buzz";
    case CLUE_TIMEOUT_MS + 1:
      return "timed out";
    default:
      return durationMs + "ms";
  }
}

const formatter = Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0, // Round to whole dollars.
  signDisplay: "always", // Show +/- for positive and negative values.
});

function Buzz({
  player,
  durationMs,
  wonBuzz,
  clueValue,
}: {
  player?: Player;
  durationMs?: number;
  wonBuzz: boolean;
  clueValue: number;
}) {
  const color = player ? stringToHslColor(player.userId) : "gray";
  const durationMsg = durationMessage(durationMs);
  const clueValueStr = clueValue ? formatter.format(clueValue) : undefined;

  return (
    <div
      className="relative px-2 py-1 flex flex-col items-center justify-center text-white text-shadow"
      style={{ color }}
    >
      {wonBuzz && clueValueStr !== undefined ? (
        <span
          className={classNames("absolute -top-5 font-bold animate-bounce", {
            "text-green-300": clueValue >= 0,
            "text-red-300": clueValue < 0,
          })}
        >
          {clueValueStr}
        </span>
      ) : null}
      <div className="font-bold">{player?.name ?? "Unknown player"}</div>
      <div>{durationMsg}</div>
    </div>
  );
}

export function Buzzes({
  buzzes,
  clueValue,
  players,
  showWinner,
  winningBuzzer,
  buzzCorrect,
}: {
  buzzes?: Map<string, number>;
  clueValue: number;
  players: Map<string, Player>;
  showWinner: boolean;
  winningBuzzer?: string;
  buzzCorrect: boolean;
}) {
  // sort players by buzz time
  const sortedPlayers = Array.from(players.entries()).sort(
    ([aUserId], [bUserId]) => {
      const aDurationMs = buzzes?.get(aUserId);
      const bDurationMs = buzzes?.get(bUserId);
      if (aDurationMs === undefined) {
        return 1;
      } else if (bDurationMs === undefined) {
        return -1;
      }
      return aDurationMs - bDurationMs;
    }
  );

  return (
    <div className="flex gap-4 w-full overflow-x-scroll">
      {sortedPlayers.map(([userId, player], i) => (
        <Buzz
          key={i}
          player={player}
          durationMs={buzzes?.get(userId)}
          wonBuzz={winningBuzzer === userId && showWinner}
          clueValue={buzzCorrect ? clueValue : -1 * clueValue}
        />
      ))}
    </div>
  );
}
