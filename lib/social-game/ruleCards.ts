import { RoleTerms } from './roles'

export type CardPosition = 'topLeft' | 'midLeft' | 'bottomLeft' | 'topRight' |'midLeft' | 'bottomRight'

export type RuleCard = {
  position: CardPosition
  phase: 'proposing' | 'voting' | 'cards' | 'waiting'
  heading: string
  body: string
}

export function getRuleCards(roleTerms: RoleTerms): RuleCard[] {
  return [
    {
      position: 'topLeft',
      phase: 'proposing',
      heading: `Proposing ${roleTerms.mission} Representatives`,
      body: `➤ Each round of gameplay will have a ${roleTerms.missionLeader} propose 2-5 reprentatives.\n\n➤ All players vote publicly on whether or not they want the proposed team to participate in the ${roleTerms.mission}.\n\n➤ If a majority approves, those players cast private votes on their intended ${roleTerms.mission} outcome.\n\n➤ Without a majority vote, the role of ${roleTerms.missionLeader} passes clockwise for another proposal.\n\n➤ If 5 proposals are rejected in a single ${roleTerms.mission}, it results in an automatic ${roleTerms.failMission}.`,
},
 {
      position: 'midLeft',
      phase: 'cards',
      heading: `${roleTerms.mission} Actions`,
  body: `➤ When selected for a ${roleTerms.mission}, ${roleTerms.goodTeamMember}s and ${roleTerms.goodCaptain} have no choice but to ${roleTerms.passMission}.\n\n➤ ${roleTerms.badTeamMember}s and ${roleTerms.badCaptain} are able to secretly ${roleTerms.failMission}, confirming an enemy is in the group.\n\n➤  If multiple players on the ${roleTerms.mission} opt to ${roleTerms.failMission}, it\u0027d be a giveaway that multiple ${roleTerms.badTeamMember}s were present.\n\n➤${roleTerms.badTeamMember}s and ${roleTerms.badCaptain} may also ${roleTerms.passMission}, concealing their identities for another round.`,
},
    {
      position: 'bottomLeft',
      phase: 'waiting',
      heading: `General Tip`,
      body: `➤ If you can see colors around player seats besides your own, you have a special role. Referencing those in gameplay will give away your role.`,
    },
  ]
}