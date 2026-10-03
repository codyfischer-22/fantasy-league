// lib/social-game/roles.ts

export type RoleTerms = {
  placeSetting: string
  goodTeamMember: string
  goodCaptain: string
  badTeamMember: string
  badCaptain: string
  mission: string
  missionLeader: string
  passMission: string
  failMission: string
  goodTeamMemberDescription: string
  goodCaptainDescription: string
  badTeamMemberDescription: string
  badCaptainDescription: string
}

export const roleTermsBySkin: Record<string, RoleTerms> = {
  neutral: {
   placeSetting: 'arena',
    goodTeamMember: 'Good Team Member',
    goodCaptain: 'Good Captain',
    badTeamMember: 'Bad Team Member',
    badCaptain: 'Bad Captain',
    mission: 'Mission',
    missionLeader: 'Mission Leader',
    passMission: 'Pass Mission',
    failMission: 'Fail Mission',
    goodTeamMemberDescription: 'Your job is to help the Good Team pass missions, discover Bad Team Members and keep them from failing missions, and protect the identity of your Good Captain.',
    goodCaptainDescription: 'You know the team alignment of every player, making you extremely valuable in helping your team pass 3 missions. If you give too much away, however, you\u0027ll be identified by the Bad Captain and lose.',
    badTeamMemberDescription: 'You know who your fellow Bad Team Members are. Your job is to blend in, cast suspicion, and help your team reject 5 proposals, fail 3 missions, or track down the Good Captain.',
    badCaptainDescription: 'You know who your fellow Bad Team Members are. Your job is to blend in, cast suspicion, and help your team reject 5 proposals, fail 3 missions, or correctly guess the Good Captain.',
  },
  island: {
    placeSetting: 'beach',
    goodTeamMember: 'Alliance Member',
    goodCaptain: 'Fan Favorite',
    badTeamMember: 'Villainous Rat',
    badCaptain: 'Villainous Snake',
    mission: 'Challenge',
    missionLeader: 'Challenge Captain',
    passMission: 'Win Immunity',
    failMission: 'Throw the Challenge',
    goodTeamMemberDescription: 'Your job is to help your alliance win immunity challenges! But be on the lookout for Villanous Rats and Snakes. You must keep them from throwing challenges, while also protecting the identity of the Fan Favorite.',
    goodCaptainDescription: 'You can read the allegiance of every player on the beach, making you extremely valuable in helping your tribe win 3 challenges. Remember that knowledge is power! If you reveal too many secrets, you\u0027ll blindsided by the Villainous Snake.',
    badTeamMemberDescription: 'You and some other known villains want to throw challenges to blindside your former alliance. Without giving away your treachery, help your team reject 5 proposals, throw 3 challenges, or blindside the Fan Favorite.',
    badCaptainDescription: 'You and some other known villains want to throw challenges to blindside your former alliance. Without giving away your treachery, help your team reject 5 proposals, throw 3 challenges, or correctly blindside the Fan Favorite.',
  },
  traitors: {
    placeSetting: 'Round Table',
    goodTeamMember: 'Faithful',
    goodCaptain: 'Most Faithful of the Faithfuls',
    badTeamMember: 'Traitor',
    badCaptain: 'Turret Master',
    mission: 'Round Table',
    missionLeader: 'First to Speak',
    passMission: 'Banish the Traitor',
    failMission: 'Save the Traitor',
    goodTeamMemberDescription: 'Your job as a faithful is to hunt down and banish traitors at 3 Round Tables. Don\u0027t let your enemies save their fellow traitors, and protect the identity of the Most Faithful of the Faithfuls.',
    goodCaptainDescription: 'You can read the motivations of every castle-goer, making you extremely valuable in banishing 3 traitors. If you give away too much, however, you\u0027ll be murdered in plain sight by the Turret Master.',
    badTeamMemberDescription: 'You know the identity of your follow traitors, and you can use this information to blend in, cast suspicion elsewhere, and save 3 traitors at the Round Table. You can also win by rejecting 5 proposals or helping your Turret Master murder the Most Faithful of the Faithfuls.',
    badCaptainDescription: 'You know the identity of your follow traitors, and you can use this information to blend in, cast suspicion elsewhere, and save 3 traitors at the Round Table. You can also win by rejecting 5 proposals or murdering the Most Faithful of the Faithfuls.',

  },
  f1: {
    placeSetting: 'paddock',
    goodTeamMember: 'Pit Crew',
    goodCaptain: 'Max Velocity',
    badTeamMember: 'Rival Spy',
    badCaptain: 'Rival Team Principal',
    mission: 'Pit Stop',
    missionLeader: 'Race Director',
    passMission: 'Clean Pit Stop',
    failMission: 'Sabotage the Car',
    goodTeamMemberDescription: 'As a loyal pit crew member, your job is to help your racer, Max Velocity, get in and out in under 2.3 seconds each pit stop. If you can nail 3 clean pit stops in the face of rival spies trying to sabotage the car, all while protecting the identity of your driver, your team wins the Constructor\u0027s Championship.',
    goodCaptainDescription: 'As a former World Champion, you know the motives of everyone in your garage. Use this information to help your pit crew nail 3 clean pit stops without giving away your own identity. If the rival Team Principal, guesses who you are, your hopes at another championship are over.',
    badTeamMemberDescription: 'You\u0027ve been sent as a rival spy to sabotage every pit stop. If you can reject 5 proposals, prevent 3 clean pit stops, or help your Team Principal identify Max Velocity, you\u0027re team wins the Constructors\u0027 Championship.',
    badCaptainDescription: 'You\u0027ve sent spys into your biggest rival\u0027s garage. If your team can reject 5 proposals or sabotage 3 pit stops, you\u0027ll finally win the Constructors\u0027 Championship. If that fails, just take out Max Velocity on the final lap.',
      },
  nascar: {
    placeSetting: 'oval',
    goodTeamMember: 'Teammate',
    goodCaptain: 'Points Leader',
    badTeamMember: 'Rival Manufacturer',
    badCaptain: 'Points Rival',
    mission: 'Restart',
    missionLeader: 'Crew Chief',
    passMission: 'Push to P1',
    failMission: 'Right Rear Spin Out',
    goodTeamMemberDescription: 'You\u0027ve been tasked by your owner to push your teammate, the Points Leader, in the final laps. Help him advance while blocking rival manufacturers from interfering or discovering his identity. If his points rival discovers who he is, your team loses the race and the Chase.',
     goodCaptainDescription: 'Your spotter has let you know where every driver is on track: you know your teammates, the rival manufacturer cars, and your points rival. Help your teammates complete 3 good pushes to win the race while keeping your identity a secret. If you are found out, you\u0027ll be in the wall.',
    badTeamMemberDescription: 'If you\u0027re not going to win the championship, it sure as hell isn\u0027t going to be a Chevota. Spin out the competition 3 times to help your manufacturer win.. or else reject 5 proposals.. or help take out the Points Leader in overtime.',
    badCaptainDescription: 'You\u0027re sitting just behind the Points Leader in the standings, and you need to spin his team out 3 times to win the biggest trophy yourself. Work with your teammates to block rival pushes, reject 5 proposals, or personally track down the Points Leader in overtime.'
      },
  }