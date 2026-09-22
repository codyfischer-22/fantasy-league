type ThemeContent = {
  displayName: string
  emoji: string
  intro: string
}

export const themeContentBySkin: Record<string, ThemeContent> = {
  neutral: {
    displayName: 'Neutral',
    emoji: '⚪',
    intro: 'A game of hidden identities and social deduction. Good Team Members must work together to complete Missions, while Bad Team Members secretly sabotage from within. Trust carefully — anyone could be lying.',
  },
  island: {
    displayName: 'Island Themed',
    emoji: '🏝️',
    intro: "Twenty-plus days on the beach, and trust is the rarest resource of all. Castaways must band together to win Challenges and outlast the game — but a few Villainous Rats are playing both sides, and one Villainous Snake is pulling the strings from the shadows. Read the tribe. Trust your gut. One blindside is all it takes.",
  },
  traitors: {
    displayName: 'Traitors Themed',
    emoji: '🗡️',
    intro: "Somewhere in this castle, Traitors walk among the Faithful — smiling, voting, plotting. Every Mission tests loyalty, and every Round Table is a chance to root out the deception before it's too late. But beware: the Turret Master is watching, and one wrong accusation could hand evil the game.",
  },
  f1: {
    displayName: 'F1 Themed',
    emoji: '🏎️',
    intro: "Somewhere in the Pit Crew, a Rival Spy is feeding secrets to the other team — and their Rival Team Principal is calling the shots from the shadows. Every Trekkon Grand Spree is a test of trust: can the team stay clean through every pit stop, or will sabotage take them out before the checkered flag?",
  },
  nascar: {
    displayName: 'NASCAR Themed',
    emoji: '🚗',
    intro: "Somewhere in the garage, a Rival Manufacturer has infiltrated the team — feeding intel back to their Points Rival with every lap. Every Trekkon Fantasy 500 is a test of loyalty: push your Teammates to victory, or risk a Right Rear Spin Out that could end the run early.",
  },
}