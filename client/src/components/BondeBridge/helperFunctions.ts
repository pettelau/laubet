import { Player } from "../../types";

export const getInitials = (players: Player[]): Record<number, string> => {
  const initials: Record<number, string> = {};
  const initialCount: Record<string, number> = {};

  // Count occurrences of each starting letter
  players
    .sort((a, b) => a.game_player_id - b.game_player_id)
    .forEach((player) => {
      initialCount[player.nickname[0]] =
        (initialCount[player.nickname[0]] || 0) + 1;
    });

  // Assign initials
  players.forEach((player, index) => {
    const initial = player.nickname[0];
    initials[index] =
      initialCount[initial] > 1 ? player.nickname.slice(0, 2) : initial;
  });

  return initials;
};
