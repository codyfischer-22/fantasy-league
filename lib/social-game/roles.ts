// lib/social-game/roles.ts

export type RoleTerms = {
  goodTeamMember: string
  goodCaptain: string
  badTeamMember: string
  badCaptain: string
  mission: string
  missionLeader: string
  passMission: string
  failMission: string
}

export const roleTermsBySkin: Record<string, RoleTerms> = {
  neutral: {
    goodTeamMember: 'Good Team Member',
    goodCaptain: 'Good Captain',
    badTeamMember: 'Bad Team Member',
    badCaptain: 'Bad Captain',
    mission: 'Mission',
    missionLeader: 'Mission Leader',
    passMission: 'Pass Mission',
    failMission: 'Fail Mission',
  },
  island: {
    goodTeamMember: 'Castaway',
    goodCaptain: 'Winner Pick',
    badTeamMember: 'Villainous Rat',
    badCaptain: 'Villainous Snake',
    mission: 'Challenge',
    missionLeader: 'Challenge Captain',
    passMission: 'Win Immunity',
    failMission: 'Throw the Challenge',
  },
  traitors: {
    goodTeamMember: 'Faithful',
    goodCaptain: 'Most Faithful of the Faithfuls',
    badTeamMember: 'Traitor',
    badCaptain: 'Turret Master',
    mission: 'Round Table',
    missionLeader: 'First to Speak',
    passMission: 'Banish the Traitor',
    failMission: 'Save the Traitor',
  },
  f1: {
    goodTeamMember: 'Pit Crew',
    goodCaptain: 'Max Velocity',
    badTeamMember: 'Rival Spy',
    badCaptain: 'Rival Team Principal',
    mission: 'Trekkon Grand Spree',
    missionLeader: 'Race Director',
    passMission: 'Clean Pit Stop',
    failMission: 'Sabotage the Car',
  },
  nascar: {
    goodTeamMember: 'Teammate',
    goodCaptain: 'Points Leader',
    badTeamMember: 'Rival Manufacturer',
    badCaptain: 'Points Rival',
    mission: 'Trekkon Fantasy 500',
    missionLeader: 'Crew Chief',
    passMission: 'Push to Victory',
    failMission: 'Right Rear Spin Out',
  },
}