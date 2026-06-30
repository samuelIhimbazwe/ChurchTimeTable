export type TourPersona =
  | 'member'
  | 'choir_leader'
  | 'treasurer'
  | 'protocol_coordinator'

export type TourStep = {
  id: string
  target: string
  route?: string
  personas: TourPersona[] | 'all'
}
