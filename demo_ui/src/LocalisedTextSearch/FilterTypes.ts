export enum FundingTypeFilterOption {
  AllFundingTypes = 'AllFundingTypes',
  PubliclyFunded = 'PubliclyFunded',
  MarketFunded = 'MarketFunded',
}

export enum NationalFilterOption {
  AllServices = 'AllServices',
  OnlyNational = 'OnlyNational',
  OnlyLimited = 'OnlyLimited',
}

export type ServiceFilters = {
  municipalities?: string[]
  serviceClasses?: string[]
  fundingTypes?: string[]
  nationalServices?: NationalFilterOption
}

export type FilterProps = {
  filters: ServiceFilters
  setFilters: (filters: ServiceFilters) => void
  name?: string
}
