export type TextSearchServiceRequestDto = {
  search_text: string
  service_filters?: {
    include_national_services?: boolean
    only_national_services?: boolean
    municipality_codes?: string[]
    region_codes?: string[]
    hospital_district_codes?: string[]
    wellbeing_county_codes?: string[]
    service_classes?: string[]
    target_groups?: string[]
    funding_type?: string[]
  }
  rerank?: boolean
}
