type MissionRequirement = {
  size: number
  failsNeeded: number
}

type PlayerCountConfig = {
  goodCount: number
  badCount: number
  missions: MissionRequirement[]
}

const gameConfigByPlayerCount: Record<number, PlayerCountConfig> = {
  5: {
    goodCount: 3,
    badCount: 2,
    missions: [
      { size: 2, failsNeeded: 1 },
      { size: 3, failsNeeded: 1 },
      { size: 2, failsNeeded: 1 },
      { size: 3, failsNeeded: 1 },
      { size: 3, failsNeeded: 1 },
    ],
  },
  6: {
    goodCount: 4,
    badCount: 2,
    missions: [
      { size: 2, failsNeeded: 1 },
      { size: 3, failsNeeded: 1 },
      { size: 4, failsNeeded: 1 },
      { size: 3, failsNeeded: 1 },
      { size: 4, failsNeeded: 1 },
    ],
  },
  7: {
    goodCount: 4,
    badCount: 3,
    missions: [
      { size: 2, failsNeeded: 1 },
      { size: 3, failsNeeded: 1 },
      { size: 3, failsNeeded: 1 },
      { size: 4, failsNeeded: 2 },
      { size: 4, failsNeeded: 1 },
    ],
  },
  8: {
    goodCount: 5,
    badCount: 3,
    missions: [
      { size: 3, failsNeeded: 1 },
      { size: 4, failsNeeded: 1 },
      { size: 4, failsNeeded: 1 },
      { size: 5, failsNeeded: 2 },
      { size: 5, failsNeeded: 1 },
    ],
  },
  9: {
    goodCount: 6,
    badCount: 3,
    missions: [
      { size: 3, failsNeeded: 1 },
      { size: 4, failsNeeded: 1 },
      { size: 4, failsNeeded: 1 },
      { size: 5, failsNeeded: 2 },
      { size: 5, failsNeeded: 1 },
    ],
  },
  10: {
    goodCount: 6,
    badCount: 4,
    missions: [
      { size: 3, failsNeeded: 1 },
      { size: 4, failsNeeded: 1 },
      { size: 4, failsNeeded: 1 },
      { size: 5, failsNeeded: 2 },
      { size: 5, failsNeeded: 1 },
    ],
  },
}