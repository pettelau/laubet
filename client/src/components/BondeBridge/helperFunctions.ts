import { Player, Round } from "../../types";

import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/nb"; // Import Norwegian locale
import { easter } from "date-easter";

dayjs.locale("nb"); // Set the locale globally

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

export const generateHolidayRanges = () => {
  const holidays = [];
  const currentYear = dayjs().year();

  for (let year = currentYear - 3; year <= currentYear; year++) {
    // Christmas
    holidays.push({
      label: `Jul ${year}`,
      from: dayjs(`${year}-12-15`),
      to: dayjs(`${year + 1}-01-15`),
    });

    // Summer
    holidays.push({
      label: `Sommer ${year}`,
      from: dayjs(`${year}-06-01`),
      to: dayjs(`${year}-08-30`),
    });

    // Easter
    const easterDate = easter(year);
    const palmSunday = dayjs(
      new Date(easterDate.year, easterDate.month - 1, easterDate.day),
    ).subtract(1, "week");
    const easterTuesday = dayjs(
      new Date(easterDate.year, easterDate.month - 1, easterDate.day),
    ).add(2, "days");

    holidays.push({
      label: `Påske ${year}`,
      from: palmSunday,
      to: easterTuesday,
    });
  }

  return holidays;
};

export const isStartingPlayer = (
  playerIndex: number,
  round: Round,
): boolean => {
  // Find the highest bid
  const highestBid = Math.max(
    ...round.player_scores.map((ps) => ps.num_tricks || 0),
  );

  // Find all players with the highest bid
  const highestBidders = round.player_scores
    .map((ps, index) => (ps.num_tricks === highestBid ? index : -1))
    .filter((index) => index !== -1);

  // Filter out the dealer if they are one of the highest bidders
  const nonDealerBidders = highestBidders.filter(
    (index) => index !== round.dealer_index,
  );

  // If there are no non-dealer highest bidders, the dealer would start (but we skip the dealer)
  if (nonDealerBidders.length === 0) {
    return highestBidders.length > 1
      ? false
      : highestBidders[0] === playerIndex;
  }

  // If only one non-dealer player has the highest bid, they start
  if (nonDealerBidders.length === 1) {
    return nonDealerBidders[0] === playerIndex;
  }

  // Find the non-dealer highest bidder closest to the dealer
  const playerPositions = nonDealerBidders.map((index) => {
    const position =
      (index - round.dealer_index + round.player_scores.length) %
      round.player_scores.length;
    return { index, position };
  });

  playerPositions.sort((a, b) => a.position - b.position);

  return playerPositions[0].index === playerIndex;
};
