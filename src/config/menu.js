import { energyMenuTree, getEnergyOpenKeys, buildEnergyRouteTitleMap, collectEnergyLeafRoutes } from './energyMenu'
import { carbonMenuTree, getCarbonOpenKeys, buildCarbonRouteTitleMap, collectCarbonLeafRoutes } from './carbonMenu'

export const appMenuTree = [...energyMenuTree, ...carbonMenuTree]

export function getMenuOpenKeys(path) {
  return [...new Set([...getEnergyOpenKeys(), ...getCarbonOpenKeys(path)])]
}

export const appRouteTitleMap = {
  ...buildEnergyRouteTitleMap(),
  ...buildCarbonRouteTitleMap()
}

export function collectAllLeafRoutes() {
  return [...collectEnergyLeafRoutes(), ...collectCarbonLeafRoutes()]
}
