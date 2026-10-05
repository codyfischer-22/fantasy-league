type ThemeContent = {
  displayName: string
  emoji: string
  intro: string
}

export const themeContentBySkin: Record<string, ThemeContent> = {
  neutral: {
    displayName: 'Classic',
    emoji: '🍞',
        intro: "You know the drill: Good Guys, Bad Guys & 5 Missions.",
        },

  island: {
    displayName: 'Beach',
    emoji: '🏝️',
    intro: "After surviving the early vote together, your once-strong alliance senses a blindside on the horizon. On one hand are the heroes out to win immunity and make the merge as a team. On the other are villains looking to sabotage the alliance and keep the fan favorite far from the million dollars.",
  },
  traitors: {
    displayName: 'Turret',
    emoji: '🗡️',
    intro: "Welcome to the Scottish Highlands, where faithful and traitors walk amongst one another. After vicious murders, a week of round tables approaches, where you must decide to banish or save the traitors on the block. The war is on between the turret master and the most faithful of the faithfuls. Who will come out of the fire of truth unscathed?",
  },
  f1: {
    displayName: 'Paddock',
    emoji: '🏎️',
    intro: "Max Velocity is a few clean pitstops away from winnnig the Trekkon Grand Spree and securing another World Championship. But beware because a rival team principal has sent his spies to your garage to sabotage the car. You must uncover and neutralize the rival spies or else miss out on the sport's biggest trophy.",
  },
  nascar: {
    displayName: 'Oval',
    emoji: '🚗',
    intro: "You are the points leader heading into the final few restarts of the Trekkon Fantasy 500! Chevotas, Forlets, and Toyords are packed tightly, and you can't tell who's friend or foe. Will your TFL Racing teammates push you to the lead or will another manufacturer spin you out and open the door for your points rival?",
}
}