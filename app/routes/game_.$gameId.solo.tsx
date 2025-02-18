import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useMatches } from "@remix-run/react";

import GameComponent from "~/components/game";
import { GameEngineContext, useSoloGameEngine } from "~/engine";
import { getValidAuthSession } from "~/models/auth";
import { getGame } from "~/models/game.server";
import { getUserByEmail } from "~/models/user";
import { getOrCreateUserSession } from "~/session.server";
import { BASE_URL, getRandomName } from "~/utils";

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => {
  try {
    return [{ title: data?.game.title }];
  } catch (error: unknown) {
    return [];
  }
};

export async function loader({ request, params }: LoaderArgs) {
  const gameId = params.gameId;

  if (!gameId) {
    throw new Response("game ID not found", { status: 404 });
  }

  const authSession = await getValidAuthSession(request);
  const game = await getGame(gameId, authSession?.userId);
  if (!game) {
    throw new Response("game not found", { status: 404 });
  }

  const user = authSession
    ? await getUserByEmail(authSession.email, authSession.accessToken)
    : null;

  const name = getRandomName();

  // Add the user to the room. If they are logged in, their ID is their user ID.
  // If they are a guest, their ID is their guest session ID.
  if (user) {
    return json({ game, userId: user.id, name, BASE_URL });
  } else {
    const headers = new Headers();
    const userId = await getOrCreateUserSession(request, headers);
    return json({ game, userId, name, BASE_URL }, { headers });
  }
}

/** SoloGame lets a single user play a game without others being able to join. If
 * they refresh the page, the game will reset.
 */
export default function SoloGame() {
  const data = useLoaderData<typeof loader>();
  const matches = useMatches();
  const pathname = matches[matches.length - 1].pathname;

  const gameReducer = useSoloGameEngine(data.game, data.userId, data.name);

  return (
    <GameEngineContext.Provider value={gameReducer}>
      <GameComponent
        game={data.game}
        roomId={-1}
        userId={data.userId}
        url={data.BASE_URL + pathname}
      />
    </GameEngineContext.Provider>
  );
}
