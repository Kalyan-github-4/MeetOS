/**
 * Placeholder data for the meeting room UI.
 *
 * This module exists only so the room can be designed and reviewed before the
 * real-time layer lands (PLAN.md Phase 4). It holds no logic — delete it once
 * meetings are resolved from the API by their code.
 */

export type Participant = {
  id: string
  name: string
  role: string
  avatarUrl: string
  micOn: boolean
  cameraOn: boolean
  isSpeaking: boolean
}

export type ChatMessage = {
  id: string
  authorId: string
  authorName: string
  avatarUrl: string
  body: string
  link?: { label: string; href: string }
  sentAt: string
  isSelf: boolean
}

export type TranscriptSegment = {
  id: string
  text: string
  highlighted?: boolean
}

export const meeting = {
  title: "Weekly Meeting Room",
  subtitle: "Casey's Meeting Room",
  recording: true,
}

export const activeSpeaker: Participant = {
  id: "casey",
  name: "Casey Kaspol",
  role: "Lead Designer",
  avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  micOn: true,
  cameraOn: true,
  isSpeaking: true,
}

export const participants: Participant[] = [
  {
    id: "daniel",
    name: "Daniel Ma",
    role: "Product Manager",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    micOn: true,
    cameraOn: true,
    isSpeaking: false,
  },
  {
    id: "drama",
    name: "Drama Doodler",
    role: "Illustrator",
    avatarUrl: "https://randomuser.me/api/portraits/men/75.jpg",
    micOn: false,
    cameraOn: true,
    isSpeaking: false,
  },
  {
    id: "kevin",
    name: "Kevin Xoxo",
    role: "Engineering Manager",
    avatarUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    micOn: true,
    cameraOn: false,
    isSpeaking: false,
  },
]

export const joinRequest = {
  name: "Wily Dozen",
  avatarUrl: "https://randomuser.me/api/portraits/men/64.jpg",
}

export const transcript: TranscriptSegment[] = [
  {
    id: "t1",
    text: "We have agreed that we are due for a 2:00 am review next Monday, so please make sure that you are working according to schedule and ready for the deadline.",
  },
  {
    id: "t2",
    text: "There are a few more tasks we need to complete this month.",
  },
  {
    id: "t3",
    text: "I will send you a list with details later today.",
    highlighted: true,
  },
]

export const summary = `We have agreed that we are due for a 2:00 am review next Monday, so please make sure that you are working according to schedule and ready for the deadline. Finally, there are a few more tasks we need to complete this month. I will send you a list with details later today. Please check your email and get ready to do them.`

export const tasks = [
  { id: "k1", label: "Update the design handoff spec", owner: "Casey Kaspol" },
  { id: "k2", label: "Prepare the 2:00 am review deck", owner: "Daniel Ma" },
  { id: "k3", label: "Send the outstanding task list", owner: "Casey Kaspol" },
]

export const messages: ChatMessage[] = [
  {
    id: "m1",
    authorId: "daniel",
    authorName: "Daniel Ma",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    body: "Yes I'm ready, you can start product meeting.",
    sentAt: "09:32",
    isSelf: false,
  },
  {
    id: "m2",
    authorId: "casey",
    authorName: "Casey Kaspol",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
    body: "Here is a design example",
    link: {
      label: "dribbble.com/shots/23025029-Dalene-Design-Interior-Studio",
      href: "https://dribbble.com/shots/23025029",
    },
    sentAt: "09:34",
    isSelf: false,
  },
  {
    id: "m3",
    authorId: "kevin",
    authorName: "Kevin Xoxo",
    avatarUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    body: "Great guys! That thing is Perfect",
    sentAt: "09:36",
    isSelf: true,
  },
]
