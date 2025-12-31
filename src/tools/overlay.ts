import type { OverlayCombatant } from "@/types/overlay"

export const getCombatants = () : Promise<OverlayCombatant[]> => {
  return new Promise((resolve) => {
    window.OverlayPluginApi!.callHandler(
      JSON.stringify({ call: 'getCombatants' }),
      (str: string) => {
        const playerData = JSON.parse(str) as { combatants: OverlayCombatant[] }
        resolve(playerData.combatants)
      }
    )
  })
}
