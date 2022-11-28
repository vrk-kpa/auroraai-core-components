export type RecommendServiceRequestDto = {
  session_id: string
  life_situation_meters: {
    family: [number]
    finance: [number]
    friends: [number]
    health: [number]
    housing: [number]
    improvement_of_strengths: [number]
    life_satisfaction: [number]
    resilience: [number]
    self_esteem: [number]
    working_studying: [number]
  }
  service_filters?: {
    include_national_services?: boolean
    municipality_codes?: string[]
    region_codes?: string[]
    hospital_district_codes?: string[]
    wellbeing_county_codes?: string[]
    service_classes?: string[]
      target_groups?: string[]
    funding_type?: string[]
  }
  age?: number
  limit?: number
}
