import { CombatService, CampaignService, isGM} from '@/services'
import { DefaultController } from './DefaultController'

const ERRCODES = {
    0: 'K00', // Error: cid [${cid}] was not valid or empty.
    1: 'K01', // Error: id [${id}] was not valid or empty.
    2: 'K02', // Error: type of id [${id}] was not a number or string.
    3: 'K03', // Error: alert.title [${alert.title}] is not of type string.
    4: 'K04', // Error: alert.cid [${alert.cid}] is not of type string.
    5: 'K05', // Error: alert.end [${alert.end}] is not of type boolean.
    6: 'K06', // Error: alert.start [${alert.start}] is not of type boolean.
    7: 'K07', // Error: alert.cid [${alert.cid}] is not of type string.
    8: 'K08', // Error: alert.description [${alert.description}] is not of type string.
    9: 'K09', // Error: alert [${alert}] is not valid or empty.
    10: 'K10', // Error: Not a GM.
    11: 'K11', // Error: newAlert [${newAlert}] is not valid.
    12: 'K12', // Error: Not actually updating member alerts.
    13: 'K13', // Error: key [${key}] or [${newData}] are not valid.
    14: 'K14', // Error: member [${member}] is not valid.
    15: 'K15', // Error: Not actually updating members.
    16: 'K16', // Error: member.name [${member.name}] is not of type string.
    17: 'K17', // Error: member.initiative [${member.initiative}] is not of type number.
    18: 'K18', // Error: member.id [${member.id}] is not of type string.
    19: 'K19', // Error: member.type [${member.type}] is not of type string.
    20: 'K20', // Error: member [${member}] is not valid or empty.
    21: 'K21', // Error: Some members in the list are not valid.
    22: 'K22', // Error: List ${list} not valid or no members. 
    23: 'K23', // Error: memberData [${memberData}] is not valid.
    24: 'K24', // Error: charData [${charData}] is not valid.
    25: 'K25', // Error: member [${member}] is not valid.
    26: 'K26', // Error: condition [${condition}] is not valid or empty.
    27: 'K27', // Error: condition.name [${condition.name}] is not of type string.
    28: 'K28', // Error: condition.duration [${condition.duration}] is not of type number.
    29: 'K29', // Error: condition.value [${condition.value}] is not of type number.
    30: 'K30', // Error: condition [${condition}] is not valid or empty.
    31: 'K31', // Error: condition.type [${condition.type}] is not of type string.
    32: 'K32', // Error: member.bid [${member.bid}] is not of type string.
    33: 'K33', // Error: member.adj [${member.adj}] is not of type string.
}

export class CombatController extends DefaultController {
    constructor(isDev) {
        super(isDev)
    }

    /* Internal functions */
    _validAlert(alert) {
        if (!!alert && !!alert.title) {
            if (typeof(alert.title) != 'string') {
                this.error(ERRCODES[3],`Error: alert.title [${alert.title}] is not of type string.`)
                return false
            }
            if (typeof(alert.round) != 'number') {
                this.error(ERRCODES[7],`Error: alert.round [${alert.round}] is not of type number.`)
                return false
            }
            if (!!alert.description && typeof(alert.description) != 'string') {
                this.error(ERRCODES[8],`Error: alert.description [${alert.description}] is not of type string.`)
                return false
            }
            return true
        } else {
            this.error(ERRCODES[9],`Error: alert [${alert}] is not valid or empty.`)
            return false
        }
    }

    _validMember(member) {
        if (!!member && !!member.name && !!member.id && !!member.type) {
            if (typeof(member.name) != 'string') {
                this.error(ERRCODES[16],`Error: member.name [${member.name}] is not of type string.`)
                return false
            }
            if ((!!member.initiative || member.initiative == 0) && typeof(member.initiative) != 'number') {
                this.error(ERRCODES[17],`Error: member.initiative [${member.initiative}] is not of type number.`)
                return false
            }
            if (typeof(member.id) != 'string') {
                this.error(ERRCODES[18],`Error: member.id [${member.id}] is not of type string.`)
                return false
            }
            if (typeof(member.type) != 'string') {
                this.error(ERRCODES[19],`Error: member.type [${member.type}] is not of type string.`)
                return false
            }
            if (!!member.bid && typeof(member.bid) != 'string') {
                this.error(ERRCODES[32],`Error: member.bid [${member.bid}] is not of type string.`)
                return false
            }
            if (!!member.adj && typeof(member.adj) != 'string') {
                this.error(ERRCODES[33],`Error: member.adj [${member.adj}] is not of type string.`)
                return false
            }
            return true
        } else {
            this.error(ERRCODES[20],`Error: member [${member}] is not valid or empty.`)
            return false
        }
    }

    _validCondition(condition) {
        if (!!condition && !!condition.type) {
            if (typeof(condition.type) != 'string') {
                this.error(ERRCODES[31],`Error: condition.type [${condition.type}] is not of type string.`)
                return false
            }
            if (!!condition.name && typeof(condition.name) != 'string') {
                this.error(ERRCODES[27],`Error: condition.name [${condition.name}] is not of type string.`)
                return false
            }
            if (!!condition.duration && typeof(condition.duration) != 'number') {
                this.error(ERRCODES[28],`Error: condition.duration [${condition.duration}] is not of type number.`)
                return false
            }
            if (!!condition.value && typeof(condition.value) != 'number') {
                this.error(ERRCODES[29],`Error: condition.value [${condition.value}] is not of type number.`)
                return false
            }
            return true
        } else {
            this.error(ERRCODES[30],`Error: condition [${condition}] is not valid or empty.`)
            return false
        }
    }

    _validcid(id) {
        if (typeof(id) == 'number') {
            const cid = !!this.members && id < this.members.length ? this.members[id] : null
            if (!!cid) {
                return true
            } else {
                this.error(ERRCODES[0],`Error: cid [${cid}] was not valid or empty.`)
                return null
            }
        } else if (typeof(id) == 'string') {
            if (!!id && !!this.members && this.members.length > 0) {
                const index = this.members.findIndex(a => a.id == id)
                if (index != -1) {
                    return true
                }
            } else {
                this.error(ERRCODES[1],`Error: id [${id}] was not valid or empty.`)
                return null
            }
        } else {
            this.error(ERRCODES[2],`Error: type of id [${id}] was not a number or string.`)
            return null
        }
    }


    /* Getters */
    get current() { return this.$store.getters['remotedb/cindex'] }
    get round() { return this.$store.getters['remotedb/cround'] }
    get target() { return this.$store.getters['rsd/tindex'] }
    get members() { return this.$store.getters['remotedb/combatMembersIds'] }
    get characterData() { return this.$store.getters['remotedb/characterData'] }
    get membersData() { return this.$store.getters['remotedb/combatMembersData'] }
    get membersConditions() { return this.$store.getters['remotedb/combatMembersConditions'] }
    get memberAlerts() { return this.$store.getters['remotedb/combatMembersAlerts']}
    get roundAlerts() { return this.$store.getters['remotedb/combatRoundAlerts']}

    getMemberKey(id) {
        if (typeof(id) == 'number') {
            const cid = !!this.members && id < this.members.length ? this.members[id] : null
            if (!!cid) {
                return id
            } else {
                this.error(ERRCODES[0],`Error: cid [${cid}] was not valid or empty.`)
                return null
            }
        } else if (typeof(id) == 'string') {
            if (!!id && !!this.members && this.members.length > 0) {
                const index = this.members.findIndex(a => a.id == id)
                const cid = index != -1 ? this.members[index] : null
                if (!!cid) {
                    return index
                } else {
                    this.error(ERRCODES[0],`Error: cid [${cid}] was not valid or empty.`)
                    return null
                }
            } else {
                this.error(ERRCODES[1],`Error: id [${id}] was not valid or empty.`)
                return null
            }
        } else {
            this.error(ERRCODES[2],`Error: type of id [${id}] was not a number or string.`)
            return null
        }
    }
    getMember(id) {
        const key = this.getMemberKey(id)
        return (!!key || key == 0) && !!this.members && !!this.members[key] ? this.members[key] : null
    }
    // getMember(id) {
    //     return (!!id || id == 0) && !!this.members && !!this.members[id] ? this.members[id] : null
    // }
    getMemberData(id) {
        return !!id && !!this.membersData && !!this.membersData[id] ? this.membersData[id] : null
    }
    getCharData(id) {
        return !!id && !!this.characterData && !!this.characterData[id] ? this.characterData[id] : null
    }
    getConditions(id) {
        return !!id && !!this.membersConditions && !!this.membersConditions[id] ? this.membersConditions[id] : null
    }
    getIdentifier(member, object = null) {
        let adjustment = !!member['adj'] ? member['adj'] : false
        let identifier = !!adjustment && adjustment != 'normal' ? this.$rsd.format.capitalize(adjustment) + ' ' : ''
        if (member.type == 'npc') {
            identifier += !!member.bid ? this.$rsd.format.capitalize(this.$rsd.bestiary.getCreatureType(member.bid)) : member.name
            identifier += ` (${member.id.substr(0,3)})`
        } else if (member.type == 'hazard') {
            identifier += 'Hazard'
            identifier += ` (${member.id.substr(0,3)})`
        } else if (member.type == 'pc' || member.type == 'gmc') {
            if (!!object && !!object.abc) {
                identifier = ''
                if (!!object.abc.a) { identifier += `${object.abc.a} `}
                if (!!object.abc.c) { identifier += `${object.abc.c}`}
                if (member.type == 'pc') {
                    identifier += ' (PC)'
                } else {
                    identifier += ' (GMC)'
                }
            } else {
                if (member.name.length <= 10) {
                    identifier += `${member.name} `
                } else {
                    identifier += `${member.name.substr(0,10)}... `
                }
                if (member.type == 'pc') {
                    identifier += ' (PC)'
                } else {
                    identifier += ' (GMC)'
                }
            }
        }
        
        return identifier
    }

    getObject(combatant, modifier = 0) {
        if (combatant.type == 'npc' || combatant.type == 'hazard') {
            return !!combatant.bid ? this.$rsd.bestiary.getObject(combatant.bid, modifier) : null
        } else {
            return !!combatant ? this.$rsd.members.getObject(combatant) : null
        }
    }

    getCombatantsArray() {
        let originalArray = this.$store.getters['remotedb/combatantsArray']

        if (!!originalArray && originalArray.length > 0) {
            originalArray.forEach((combatant, key) => {
                const modifier = !!combatant.adj && combatant.adj != 'normal' ? (combatant.adj == 'weak' ? -2 : 2) : 0

                const basestats = combatant.type == 'npc' || combatant.type == 'hazard'
                    ? this.$rsd.bestiary.getStats(combatant.bid, modifier)
                    : this.$rsd.members.getStats(combatant)

                if (!!originalArray[key].health) {
                    originalArray[key].health.maxhp = !!basestats && !!basestats.maxhp ? basestats.maxhp : 1
                }

                const object = this.getObject(combatant, modifier)
                const stats = this.$rsd.conditions.getStatsObject(combatant, basestats, combatant.conditions, object)

                originalArray[key].identifier = this.$rsd.combat.getIdentifier(combatant, object)
                originalArray[key].basestats = basestats
                originalArray[key].object = object
                originalArray[key].stats = stats

                if (!!object && !!object.name && (combatant.type == 'gmc' || combatant.type == 'pc')) {
                    originalArray[key].name = object.name
                }
            })
        }

        return originalArray
    }

    /* Setters */
    set target(newTarget) {
        if (!!newTarget || newTarget == 0) {
            this.$store.dispatch('rsd/setCombatTarget', newTarget)
        } else {
            this.error(ERRCODES[4],`Error: newTarget [${newTarget}] is not valid or no a GM.`)
        }
    }
    // setActive(partyid, gmid = null) {
    //     if (!!partyid && typeof(partyid) == 'string' && (!gmid || (!!gmid && typeof(gmid) == 'string'))) {
    //         this._setPartyID(partyid)
    //         this._setGMID(gmid)
    //         CombatService.loadCurrentCombat(this._PartyID, this._GMID)
    //         this._setTarget(this.$store.getters['rsd/gamestate'].view.combat.target)
    //     } else {
    //         this.error(ERRCODES[3],`Error: partyid/gmid [${partyid}/${gmid}] is not valid or not of type string.`)
    //     }
    // }

    set(newCombat) {
        if (!!newCombat && typeof(newCombat) == 'object') {
            CombatService.updateCombat({...newCombat})
        } else {
            this.error(ERRCODES[2],`Error: newCombat [${newCombat}] is not valid or newCombat is not of type object.`)
        }
    }

    setMembersArray(newArray, draggedObject = null) {
        if (!!newArray && typeof(newArray) == 'object' && newArray.length > 0) {
            if (!!this.members) {
                let filteredArray = []
                newArray.forEach(na => {
                    let fa = {
                        id: na.id,
                        name: na.name,
                        initiative: na.initiative,
                        type: na.type,
                    }

                    if (!!na.adj) { fa.adj = na.adj }
                    if (!!na.bid) { fa.bid = na.bid }
                    if (!!na.color) { fa.color = na.color }

                    filteredArray.push(fa)
                })

                if (!!draggedObject) {
                    filteredArray = this._fixMembersArrayInitiative(filteredArray, draggedObject)
                }

                if (JSON.stringify(filteredArray) != JSON.stringify(this.members)) {
                    this.$store.dispatch('remotedb/setCombatMembers', {content: {ids: filteredArray}, instant: true})
                    CombatService.updateCombatMembersIds(filteredArray)
                }
            }
        } else {
            this.error(ERRCODES[16],`Error: array [${array}] is not of type object or is empty.`)
        }
    }

    /* Adders */
    addCombatant(bid) {
        if (!!bid) {
            const single = this.$rsd.bestiary.getSaveObject(bid)
            if (!!single && !!this._validMember(single)) {
                CombatService.addCombatMemberAlt(single, this.CompareInitiative)
            }
        }
    }

    addPartyMember(single) {
        if (!!single && !!this._validMember(single)) {
            // TODO: Same as below but for a single item
        }
    }

    addPartyMembers(list) {
        if (!!list && list.length > 0) {
            // Check if all valid members
            let validMembers = true
            list.forEach(m => {
                validMembers = validMembers && this._validMember(m)
            })

            if (!!validMembers) {
                // TODO: For NPC, we need to add an entry to CMData for HP
                // For all, we need to add them to the combatmembers using updateCombatMembersIds
                let membersArray = []
                let membersDataArray = {}
                if (!!this.members && this.members.length > 0) {
                    membersArray = [...this.members]
                }
                if (!!this.membersData && Object.keys(this.membersData).length > 0) {
                    membersDataArray = {...this.membersData}
                }

                list.forEach(m => {
                    const memberObject = this._getMemberObject(m)
                    const memberDataObject = this._getMemberDataObject(m)

                    if (!!memberObject) {
                        membersArray.push(memberObject)
                    }
                    if (!!memberDataObject) {
                        membersDataArray[member.id] = memberDataObject
                    }
                })

                if (!!membersArray && membersArray.length > 0 && JSON.stringify(membersArray) != JSON.stringify(this.members)) {
                    const newMembersArray = this._sortMembersArray(membersArray)
                    CombatService.updateCombatMembersIds(newMembersArray)
                }
                if (!!membersDataArray && Object.keys(membersDataArray).length > 0 && JSON.stringify(membersDataArray) != JSON.stringify(this.membersData)) {
                    CombatService.updateCombatMembersData(membersDataArray)
                }
                
            } else {
                this.error(ERRCODES[21],`Error: Some members in the list are not valid.`)
            }
        } else {
            this.error(ERRCODES[22],`Error: List ${list} not valid or no members.`)
        }
    }

    _getMemberObject(member) {
        let data = {
            id: member.id,
            initiative: member.initiative,
            name: member.name,
            type: member.type
        }

        if (!!member.bid && (member.type == 'npc' || member.type == 'hazard')) {
            data.adj = member.adj
            data.bid = member.bid
        }

        return data
    }
    _getMemberDataObject(member) {
        let data = null
        if (!!member.bid && (member.type == 'npc' || member.type == 'hazard')) {
            data = {
                hp: this.$rsd.bestiary.getHP(member.bid),
                temphp: 0,
            }
        }
        return data
    }

    addMemberAlert(cid, newAlert) {
        if (!!newAlert && !!this._validcid(cid) && !!this._validAlert(newAlert)) {
            if (!!isGM) {
                let memberAlertsArray = {}
                if (!this.memberAlerts) {
                    memberAlertsArray[cid] = [newAlert]
                } else {
                    memberAlertsArray = {...this.memberAlerts}
                    if (!this.memberAlerts[cid]) {
                        memberAlertsArray[cid] = [newAlert]
                    } else if (this.memberAlerts[cid].length < 3){
                        memberAlertsArray[cid].push(newAlert)
                    }
                }

                CombatService.updateCombatMembersAlerts(memberAlertsArray)
            } else {
                this.error(ERRCODES[10],`Error: Not a GM.`)
            }
        } else {
            this.error(ERRCODES[11],`Error: newAlert [${newAlert}] is not valid.`)
        }
    }

    addRoundAlert(newAlert) {
        if (!!newAlert && !!this._validAlert(newAlert)) {
            if (!!isGM) {
                let roundAlertsArray = {}
                if (!this.roundAlerts) {
                    roundAlertsArray = [newAlert]
                } else if (this.roundAlerts.length < 10){
                    roundAlertsArray = [...this.roundAlerts]
                    roundAlertsArray.push(newAlert)
                }

                CombatService.updateCombatAlerts(roundAlertsArray)
            } else {
                this.error(ERRCODES[10],`Error: Not a GM.`)
            }
        } else {
            this.error(ERRCODES[11],`Error: newAlert [${newAlert}] is not valid.`)
        }
    }

    /* Updaters */
    updateMemberAlert(cid, alertIndex, updatedAlert) {
        if (!!updatedAlert && !!this._validcid(cid) && !!this._validAlert(updatedAlert) && (!!alertIndex || alertIndex == 0)) {
            if (!!isGM) {
                if (!this.memberAlerts || !this.memberAlerts[cid] || !this.memberAlerts[cid][alertIndex]) {
                    this.error(ERRCODES[12],`Error: Not actually updating member alerts.`)
                } else if (!!this.memberAlerts && !!this.memberAlerts[cid] && !!this.memberAlerts[cid][alertIndex]){
                    let memberAlertsArray = {...this.memberAlerts}

                    if (JSON.stringify(memberAlertsArray[cid][alertIndex]) != JSON.stringify(updatedAlert)) {
                        memberAlertsArray[cid][alertIndex] = updatedAlert
                        CombatService.updateCombatMembersAlerts(memberAlertsArray)
                    }
                }
            } else {
                this.error(ERRCODES[10],`Error: Not a GM.`)
            }
        } else {
            this.error(ERRCODES[11],`Error: updatedAlert [${updatedAlert}] is not valid.`)
        }
    }

    updateRoundAlert(alertIndex, updatedAlert) {
        if (!!updatedAlert && !!this._validAlert(updatedAlert) && (!!alertIndex || alertIndex == 0)) {
            if (!!isGM) {
                if (!this.roundAlerts || !this.roundAlerts[alertIndex]) {
                    this.error(ERRCODES[12],`Error: Not actually updating round alerts.`)
                } else if (!!this.roundAlerts && !!this.roundAlerts[alertIndex]){
                    let roundAlertsArray = [...this.roundAlerts]

                    if (JSON.stringify(roundAlertsArray[alertIndex]) != JSON.stringify(updatedAlert)) {
                        roundAlertsArray[alertIndex] = updatedAlert
                        CombatService.updateCombatAlerts(roundAlertsArray)
                    }
                }
            } else {
                this.error(ERRCODES[10],`Error: Not a GM.`)
            }
        } else {
            this.error(ERRCODES[11],`Error: updatedAlert [${updatedAlert}] is not valid.`)
        }
    }

    updateMember(id, newData) {
        if (!!newData && !!this._validcid(id)) {
            const key = this.getMemberKey(id)
            const data = this.getMember(key)

            const local = !!this.$rsd.playercharacters ? this.$rsd.playercharacters.activeKey : null
            
            if (!!data && (!!isGM || (!!local && !!data.id && local == data.id))) {
                const newMembers = this.members
                newMembers[key] = {...data, ...newData}

                if (!!newData.initiative || newData.initiative == 0) {
                    if (!!this.members && this.members.length > 0) {
                        const newMembersArray = this._sortMembersArray(newMembers)
                        CombatService.updateCombatMembersIds(newMembersArray)
                    }
                } else {
                    CombatService.updateCombatMembersByIndex(key, {...data, ...newData})
                }
            } else {
                this.error(ERRCODES[10],`Error: Not a GM.`)
            }
        } else {
            this.error(ERRCODES[13],`Error: key [${key}] or [${newData}] are not valid.`)
        }
    }

    updateMemberData(key, newData) {
        if (!!newData && !!this._validcid(key)) {
            const member = this.getMember(key)
            
            if (!!member) {
                if (member.type == 'npc' || member.type == 'hazard') {
                    const memberData = this.getMemberData(member.id)

                    if (!!memberData) {
                        const newMembersData = {temphp: Math.max(newData.temphp, 0), hp: Math.max(newData.hp, 0)}
                        CombatService.updateCombatMembersById(member.id, newMembersData)
                    } else {
                        this.error(ERRCODES[23],`Error: memberData [${memberData}] is not valid.`)
                    }
                } else if (member.type == 'pc' || member.type == 'gmc') {
                    const charData = this.getCharData(member.id)

                    if (!!charData) {
                        const newMembersData = {temphp: Math.max(newData.temphp, 0), hp: Math.max(newData.hp, 0)}
                        CampaignService.updateCharSpecificData(member.id, newMembersData)
                    } else {
                        this.error(ERRCODES[24],`Error: charData [${charData}] is not valid.`)
                    }
                }
            } else {
                this.error(ERRCODES[25],`Error: member [${member}] is not valid.`)
            }
        } else {
            this.error(ERRCODES[13],`Error: key [${key}] or [${newData}] are not valid.`)
        }
    }

    doDamage(key, newData) {
        // do damage to temphp & hp
        // add dying if required (deal with crit)
        if (!!this._validcid(key)) {
            const member = this.getMember(key)
            const currentKey = this.getMemberKey(key)

            // TODO: Jump to new place in initiative order if dying

            if (!!member) {
                const healthInfo = !!member.bid ? this.$rsd.bestiary.getHealthInfo(member.bid) : null
                const totalDamage = this.getTotalDamage([newData], healthInfo)

                if (member.type == 'npc' || member.type == 'hazard') {
                    const memberData = this.getMemberData(member.id)

                    if (!!memberData) {
                        let newTempHP = memberData.temphp
                        let newHP = memberData.hp

                        if (newTempHP - totalDamage > 0) {
                            newTempHP -= totalDamage
                        } else {
                            const risidualDamage = Math.abs(newTempHP - totalDamage)
                            newTempHP = 0
                            newHP -= risidualDamage
                            this._removeTemporaryHP(member.id)
                        }

                        const newMembersData = {temphp: newTempHP, hp: Math.max(newHP, 0)}
                        CombatService.updateCombatMembersById(member.id, newMembersData)

                        // console.log('doDamage', newHP)

                        if (newHP <= 0) {
                            this.emit('DieOrRemove', {valid: true, crit: newData.crit, affected: {...member, _key:currentKey}})
                        } else {
                            this.emit('DieOrRemove', {valid: false, crit: newData.crit, affected: {...member, _key:currentKey}})
                        }

                        // Add to recent damage
                        this.$store.dispatch('rsd/pushRecentDamage', {type: newData.dmg, value: newData.value})
                    } else {
                        this.error(ERRCODES[23],`Error: memberData [${memberData}] is not valid.`)
                    }
                } else if (member.type == 'pc' || member.type == 'gmc') {
                    // TODO: Get health info for resistances/weaknesses/immunities
                    const charData = this.getCharData(member.id)
                    if (!!charData) {
                        let newTempHP = charData.temphp
                        let newHP = charData.hp

                        if (newTempHP - totalDamage > 0) {
                            newTempHP -= totalDamage
                        } else {
                            const risidualDamage = Math.abs((newTempHP - totalDamage))
                            newTempHP = 0
                            newHP -= risidualDamage
                            this._removeTemporaryHP(member.id)
                        }

                        const newMembersData = {temphp: newTempHP, hp: Math.max(newHP, 0)}
                        CampaignService.updateCharSpecificData(member.id, newMembersData, (success) => {
                            if (!!success) {
                                if (newHP <= 0) {
                                    this.increaseMemberDying(key, !!newData.crit ? 2 : 1)
                                }

                                this.emit('DieOrRemove', {valid: false, crit: newData.crit, affected: {...member, _key:currentKey}})
                            }
                        })

                        // Add to recent damage
                        this.$store.dispatch('rsd/pushRecentDamage', {type: newData.dmg, value: newData.value})
                    } else {
                        this.error(ERRCODES[24],`Error: charData [${charData}] is not valid.`)
                    }
                }
            } else {
                this.error(ERRCODES[25],`Error: member [${member}] is not valid.`)
            }
        }
    }

    doHeal(key, newData) {
        if (!!this._validcid(key)) {
            const member = this.getMember(key)

            if (!!member) {
                if (member.type == 'npc' || member.type == 'hazard') {
                    // check membersConditions for dying
                    // update through CampaignsController
                    this._handleHealDying(member.id)

                    const memberData = this.getMemberData(member.id)

                    if (!!memberData) {
                        const newMembersData = {temphp: memberData.temphp, hp: Math.min(memberData.hp + newData.hp, memberData.maxhp)}
                        CombatService.updateCombatMembersById(member.id, newMembersData)
                    } else {
                        this.error(ERRCODES[23],`Error: memberData [${memberData}] is not valid.`)
                    }
                } else if (member.type == 'pc' || member.type == 'gmc') {
                    // check membersConditions for dying
                    // update through CampaignsController
                    this._handleHealDying(member.id)

                    const charData = this.getCharData(member.id)
                    if (!!charData) {
                        const newMembersData = {temphp: charData.temphp, hp: Math.min(charData.hp + newData.hp, charData.maxhp)}
                        CampaignService.updateCharSpecificData(member.id, newMembersData)
                    } else {
                        this.error(ERRCODES[24],`Error: charData [${charData}] is not valid.`)
                    }
                }
            } else {
                this.error(ERRCODES[25],`Error: member [${member}] is not valid.`)
            }
        }
    }

    // This will remove the dying condition (and linked)
    // This will also add wounded based on the dying value
    _handleHealDying(id, healed = true) {
        const conditions = this.getConditions(id)
        if (!!conditions && conditions.length > 0) {
            const dying = conditions.find(c => c.type.toLowerCase() == 'dying')
            const wounded = conditions.find(c => c.type.toLowerCase() == 'wounded')
            let woundedValue = 0
            let linked = []

            if (!!dying) {
                woundedValue += 1
                linked = !!healed ? this.$rsd.conditions.getConditionsLinkedRecursive('dying') : [{type: 'dying'}]
            }
            if (!!wounded) {
                woundedValue += wounded.value
            }

            let newConditions = []
            conditions.forEach(c => {
                if ((!c.linked && (!!dying && c.id != dying.id)) || (!linked || (!!linked && linked.length == 0)) || (!!linked && linked.length > 0 && !linked.find(l => l.type.toLowerCase() == c.type.toLowerCase()))) {
                    newConditions.push({...c})
                }
            })

            if (!!woundedValue && woundedValue > 0) {
                if (!!wounded) {
                    const woundedIndex = newConditions.findIndex(nc => nc.id == wounded.id)
                    if (woundedIndex != -1) {
                        newConditions[woundedIndex].value = woundedValue
                    }
                } else {
                    newConditions.push({type: 'wounded', value: woundedValue, id: this.$rsd.random.getRandomUID(20)})
                }
            }

            if (!!newConditions && newConditions.length > 0) {
                newConditions.forEach(c => {
                    this._addMissingLinked(c.type, newConditions)
                })
            }

            if (!!newConditions && newConditions.length > 0) {
                CombatService.updateCombatMembersConditionsById(id, newConditions)
            }
        }
    }

    _removeTemporaryHP(id) {
        const conditions = this.getConditions(id)
        if (!!conditions && conditions.length > 0) {
            const tempHP = conditions.find(c => c.type.toLowerCase() == 'temporary hp')

            let newConditions = []
            conditions.forEach(c => {
                if (!!tempHP && c.id != tempHP.id) {
                    newConditions.push({...c})
                }
            })

            if (!!newConditions && newConditions.length > 0) {
                newConditions.forEach(c => {
                    this._addMissingLinked(c.type, newConditions)
                })
            }

            if (!!newConditions && newConditions.length > 0) {
                CombatService.updateCombatMembersConditionsById(id, newConditions)
            }
        }
    }

    doTemporaryHP(key, newData) {
        if (!!this._validcid(key)) {
            const member = this.getMember(key)

            if (!!member) {
                if (member.type == 'npc' || member.type == 'hazard') {
                    const memberData = this.getMemberData(member.id)

                    if (!!memberData) {
                        const newMembersData = {temphp: Math.max(newData.value, 0), hp: memberData.hp}
                        CombatService.updateCombatMembersById(member.id, newMembersData, (success) => {
                            if (!!success) {
                                this.addCondition(key, {type: 'temporary hp', duration: newData.duration})
                            }
                        })
                    } else {
                        this.error(ERRCODES[23],`Error: memberData [${memberData}] is not valid.`)
                    }
                } else if (member.type == 'pc' || member.type == 'gmc') {
                    const charData = this.getCharData(member.id)
                    if (!!charData) {
                        const newMembersData = {temphp: Math.max(newData.value, 0), hp: charData.hp}
                        CampaignService.updateCharSpecificData(member.id, newMembersData, (success) => {
                            if (!!success) {
                                this.addCondition(key, {type: 'temporary hp', duration: newData.duration})
                            }
                        })
                    } else {
                        this.error(ERRCODES[24],`Error: charData [${charData}] is not valid.`)
                    }
                }
            } else {
                this.error(ERRCODES[25],`Error: member [${member}] is not valid.`)
            }
        }
    }

    increaseMemberDying(key, value, oldConditions = null) {
        if (!!value && value > 0 && !!this._validcid(key)) {
            const member = this.getMember(key)

            if (!!member && !!member.id) {
                const conditions = !!oldConditions ? oldConditions : this.getConditions(member.id)
                
                if (!!conditions && conditions.length > 0) {
                    const dying = conditions.find(c => c.type.toLowerCase() == 'dying')
                    const wounded = conditions.find(c => c.type.toLowerCase() == 'wounded')
                    let dyingValue = value

                    if (!!dying) {
                        dyingValue += dying.value

                        this.updateCondition(key, {id: dying.id, type: 'dying', value: dyingValue}, conditions)
                    } else {
                        if (!!wounded) {
                            dyingValue += wounded.value
                        }

                        this.addCondition(key, {type: 'dying', value: dyingValue}, null, conditions)
                    }
                } else {
                    this.addCondition(key, {type: 'dying', value: value})
                }
            }
        }
    }

    addCondition(key, newData, callback = null, oldConditions = null) {
        if (!!this._validcid(key) && !!this._validCondition(newData)) {
            const member = this.getMember(key)

            if (!!member && !!member.id) {
                const conditions = !!oldConditions ? oldConditions : this.getConditions(member.id)

                // Check if the condition is already applied
                // If duration is longer -> override
                // If duration is shorter -> do nothing
                // If value is different -> apply as well
                let worseDuplicate = false
                let newConditions = []
                if (!!conditions && conditions.length > 0) {
                    conditions.forEach(c => {
                        if (!!c && !!c.type && c.type.toLowerCase() != newData.type.toLowerCase()) {
                            newConditions.push({...c})
                        } else if (!!c && !!c.type && c.type.toLowerCase() == newData.type.toLowerCase() && c.type.toLowerCase() != 'temporary hp') {
                            // Special exception if it's persistent damage condition
                            if (c.type.toLowerCase() == 'persistent damage') {
                                // If the damage type matches we need to take the bigger value. Otherwise, just add it
                                if (c.dmg == newData.dmg) {
                                    if (c.value >= newData.value) {
                                        newConditions.push({...c})
                                        worseDuplicate = true
                                    }
                                } else {
                                    newConditions.push(c)
                                }
                            } else if (c.type.toLowerCase() == 'custom') {
                                newConditions.push({...c})
                            } else {
                                // If the condition value is equal, take the one with longer condition. Otherwise, just add it.
                                if (c.value == newData.value) {
                                    if (c.duration >= newData.duration) {
                                        newConditions.push({...c})
                                        worseDuplicate = true
                                    }
                                } else {
                                    newConditions.push({...c})
                                }
                            }
                        }
                    })
                }

                // TODO: Check if drained -> it's special that way (does damage)

                // Only add the new condition if it's not worse than an existing one
                if (!worseDuplicate) {
                    let addedCondition = {type: newData.type, id: this.$rsd.random.getRandomUID(20)}
                    if (!!newData.name) { addedCondition.name = newData.name }
                    if (!!newData.value) { addedCondition.value = newData.value }
                    if (!!newData.reduce) { addedCondition.reduce = newData.reduce }
                    if (!!newData.floor) { addedCondition.floor = newData.floor }
                    if (!!newData.duration) { addedCondition.duration = newData.duration }
                    if (!!newData.dmg) { addedCondition.dmg = newData.dmg }

                    // TODO: Custom condition styling
                    // if (!!newData.icon) { addedCondition.icon = newData.icon }

                    newConditions.push({...addedCondition})

                    if (addedCondition.type.toLowerCase() != 'custom') {
                        this._addMissingLinked(newData.type, newConditions)
                    }

                    if (addedCondition.type.toLowerCase() == 'persistent damage') {
                        // Add to recent pdamage
                        this.$store.dispatch('rsd/pushRecentPDamage', addedCondition)
                    } else if (addedCondition.type.toLowerCase() != 'temporary hp') {
                        // Add to recent condition
                        this.$store.dispatch('rsd/pushRecentCondition', addedCondition)
                    }

                    if (!!newConditions && newConditions.length > 0) {
                        CombatService.updateCombatMembersConditionsById(member.id, newConditions, callback)
                    }
                }
            } else {
                this.error(ERRCODES[25],`Error: member [${member}] is not valid.`)
            }
        }
    }

    updateCondition(key, newData, newConditions = null) {
        if (!!this._validcid(key) && !!this._validCondition(newData)) {
            const member = this.getMember(key)
            if (!!member && !!member.id) {
                const conditions = !!newConditions ? newConditions : this.getConditions(member.id)

                let newConditionsList = []
                if (!!conditions && conditions.length > 0) {
                    conditions.forEach(c => {
                        if (!!c && !!c.id && c.id != newData.id) {
                            newConditionsList.push({...c})
                        } else if (!!c && !!c.id && c.id == newData.id) {
                            newConditionsList.push({...newData})
                        }
                    })
                }

                if (!!newConditionsList && newConditionsList.length > 0) {
                    CombatService.updateCombatMembersConditionsById(member.id, newConditionsList)
                }
            } else {
                this.error(ERRCODES[25],`Error: member [${member}] is not valid.`)
            }
        }
    }

    /* Removers */
    removeMember(member, callback = null) {
        if (!!member && !!this._validcid(member.id)) {
            const key = this.getMemberKey(member.id)
            if (!!isGM) {
                if (!this.members || !this.members[key]) {
                    if (!!callback) {
                        callback(false)
                    }
                    this.error(ERRCODES[15],`Error: Not actually updating members.`)
                } else if (!!this.members && !!this.members[key]){
                    let membersArray = [...this.members]
                    const removed = membersArray.splice(key, 1)

                    if (!!removed && !!removed[0]) {
                        CombatService.updateCombatMembersIds(membersArray, (success) => {
                            if (!!success) {
                                // Remove alerts / conditions / memberdata here
                                CombatService.removeCombatMemberData(removed[0], callback)
                            }
                        })
                    }
                }
            } else {
                if (!!callback) {
                    callback(false)
                }
                this.error(ERRCODES[10],`Error: Not a GM.`)
            }
        } else {
            if (!!callback) {
                callback(false)
            }
            this.error(ERRCODES[14],`Error: member [${member}] is not valid.`)
        }
    }

    removeMemberAlert(cid, alertIndex) {
        if (!!this._validcid(cid) && (!!alertIndex || alertIndex == 0)) {
            if (!!isGM) {
                if (!this.memberAlerts || !this.memberAlerts[cid] || !this.memberAlerts[cid][alertIndex]) {
                    this.error(ERRCODES[12],`Error: Not actually updating member alerts.`)
                } else if (!!this.memberAlerts && !!this.memberAlerts[cid] && !!this.memberAlerts[cid][alertIndex]){
                    let memberAlertsArray = {...this.memberAlerts}
                    memberAlertsArray[cid].splice(alertIndex, 1)

                    CombatService.updateCombatMembersAlerts(memberAlertsArray)
                }
            } else {
                this.error(ERRCODES[10],`Error: Not a GM.`)
            }
        } else {
            this.error(ERRCODES[11],`Error: updatedAlert [${updatedAlert}] is not valid.`)
        }
    }

    removeCondition(key, newData, callback = null) {
        if (!!this._validcid(key) && !!this._validCondition(newData)) {
            const member = this.getMember(key)
            if (!!member && !!member.id) {
                const conditions = this.getConditions(member.id)
                if (!!conditions && conditions.length > 0) {
                    const candidateCondition = conditions.find(c => c.id == newData.id)
                    if (!!candidateCondition) {
                        const linked = this.$rsd.conditions.getConditionsLinkedRecursive(newData.type.toLowerCase())

                        let newConditions = []
                        conditions.forEach(c => {
                            if ((!c.linked && c.id != candidateCondition.id) || (!linked || (!!linked && linked.length == 0)) || (!!linked && linked.length > 0 && !linked.find(l => l.type.toLowerCase() == c.type.toLowerCase()))) {
                                newConditions.push({...c})
                            }
                        })

                        if (!!newConditions && newConditions.length > 0) {
                            newConditions.forEach(c => {
                                this._addMissingLinked(c.type, newConditions)
                            })
                        }

                        if (!!newConditions) {
                            CombatService.updateCombatMembersConditionsById(member.id, newConditions, callback)
                        }
                    }
                }
            } else {
                this.error(ERRCODES[25],`Error: member [${member}] is not valid.`)
            }
        }
    }

    removeRoundAlert(alertIndex) {
        if (!!alertIndex || alertIndex == 0) {
            if (!!isGM) {
                if (!this.roundAlerts || !this.roundAlerts[alertIndex]) {
                    this.error(ERRCODES[12],`Error: Not actually updating member alerts.`)
                } else if (!!this.roundAlerts && !!this.roundAlerts[alertIndex]){
                    let roundAlertsArray = [...this.roundAlerts]
                    roundAlertsArray.splice(alertIndex, 1)

                    CombatService.updateCombatAlerts(roundAlertsArray)
                }
            } else {
                this.error(ERRCODES[10],`Error: Not a GM.`)
            }
        } else {
            this.error(ERRCODES[11],`Error: updatedAlert [${updatedAlert}] is not valid.`)
        }
    }

    /* Functions */
    processPersistentDamageCheck(data) {
        if (!!data.checks && !!data.dc && !!data.damage && !!data.id) {
            const key = this.getMemberKey(data.id)
            const member = this.getMember(key)
            const conditions = this.getConditions(member.id)

            if ((!!key || key == 0) && !!member && !!member.id && !!conditions && conditions.length > 0) {
                // List of ones to remove
                let removePDamages = []
                // List of all the damage to apply
                let damageArray = []
                Object.keys(data.cid).forEach(type => {
                    if (data.checks[type] >= data.dc[type]) {
                        removePDamages.push(data.cid[type])
                    }
                    damageArray.push({dmg: type, value: data.damage[type]})
                })

                let newConditions = []
                conditions.forEach(c => {
                    if (!removePDamages.includes(c.id)) {
                        newConditions.push({...c})
                    }
                })

                CombatService.updateCombatMembersConditionsById(member.id, newConditions, (success) => {
                    if (!!success) {
                        const healthInfo = !!member.bid ? this.$rsd.bestiary.getHealthInfo(member.bid) : null
                        const totalDamage = this.getTotalDamage(damageArray, healthInfo)

                        // TODO: process damage here, add dying if needed, and remove any checks you did make

                        if (member.type == 'npc' || member.type == 'hazard') {
                            const memberData = this.getMemberData(member.id)

                            if (!!memberData) {
                                // TODO: Get health info for resistances/weaknesses/immunities
                                let newTempHP = memberData.temphp
                                let newHP = memberData.hp

                                if (newTempHP - totalDamage > 0) {
                                    newTempHP -= totalDamage
                                } else {
                                    const risidualDamage = Math.abs(newTempHP - totalDamage)
                                    newTempHP = 0
                                    newHP -= risidualDamage
                                }

                                const newMembersData = {temphp: newTempHP, hp: Math.max(newHP, 0)}
                                CombatService.updateCombatMembersById(member.id, newMembersData)

                                // console.log('newHP', newHP)

                                if (newHP <= 0) {
                                    this.emit('DieOrRemove', {valid: true, crit: data.crit, affected: {...member, _key:key}})
                                } else {
                                    this.emit('DieOrRemove', {valid: false, crit: data.crit, affected: {...member, _key:key}})
                                }

                            } else {
                                this.error(ERRCODES[23],`Error: memberData [${memberData}] is not valid.`)
                            }
                        } else if (member.type == 'pc' || member.type == 'gmc') {
                            // TODO: Get health info for resistances/weaknesses/immunities
                            const charData = this.getCharData(member.id)
                            if (!!charData) {
                                let newTempHP = charData.temphp
                                let newHP = charData.hp

                                if (newTempHP - totalDamage > 0) {
                                    newTempHP -= totalDamage
                                } else {
                                    const risidualDamage = Math.abs((newTempHP - totalDamage))
                                    newTempHP = 0
                                    newHP -= risidualDamage
                                }

                                const newMembersData = {temphp: newTempHP, hp: Math.max(newHP, 0)}
                                CampaignService.updateCharSpecificData(member.id, newMembersData)

                                if (newHP <= 0) {
                                    this.increaseMemberDying(key, 1, newConditions)
                                }
                                this.emit('DieOrRemove', {valid: false, crit: data.crit, affected: {...member, _key:key}})
                            }
                        }
                    }
                })
            }
        }
    }
    processRecoveryCheck(data) {
        if (!!data && !!data.receiver && !!data.receiver.id && !!this._validcid(data.receiver.id) && !!this.members) {
            const key = this.members.findIndex(a => a.id == data.receiver.id)
            const member = this.getMember(key)
            const conditions = this.getConditions(member.id)

            if (!!member && member.id && !!data.dc && !!data.check && !!conditions && conditions.length > 0) {
                const dying = conditions.find(c => c.type.toLowerCase() == 'dying')

                if (data.check < data.dc) {
                    let newValue = dying.value + 1
                    if (data.check + 10 <= data.dc) {
                        newValue += 1
                    }
                    this.updateCondition(key, {id: dying.id, type: 'dying', value: newValue})
                } else {
                    if (dying.value > 1) {
                        const newValue = dying.value - 1
                        this.updateCondition(key, {id: dying.id, type: 'dying', value: newValue})
                    } else {
                        this._handleHealDying(member.id, false)
                    }
                }
            }
        }
    }

    reset() {
        if (!!CombatService) {
            CombatService.reset()
        }
    }

    clear() {
        if (!!CombatService) {
            CombatService.clearCombat()
        }
    }

    next() {
        // TODO: basically use this.$rsd to do all of these emits

        // Do I want to set target to -1?
        // this.Combat.set.target(-1)
        if (!!this.members && this.members.length > 0) {
            // Fire an event to check for persistent damage for the current actor
            // this.emit('PersistentDamageCheck', {index: this.current})
            // this.emit('ProcessConditions', {index: this.current})
            // this.emit('ProcessAlerts', {index: this.current, start: false})
            this._processMemberAlerts(this.current)
            this._processMemberConditions(this.current)


            let nextInit = this.current+1
            // Need some sort of members object for this this.Combat.Members().get.ids().length
            if (nextInit >= this.members.length) {
                nextInit = 0

                this._dyingCheck(nextInit)

                this.set({
                    curInit: nextInit,
                    round: this.round+1
                })

                // this.Combat.Alerts().do.process()
                // this.emit('ProcessRoundAlerts')
                this._processRoundAlerts()
            } else {
                this._dyingCheck(nextInit)

                this.set({
                    curInit: nextInit,
                    round: this.round
                })
            }
        }

        // this.emit('ProcessAlerts', {index: nextInit, start: true})
        // this.emit('RecoveryCheck', {index: nextInit})
    }

    _dyingCheck(index) {
        if (!!this._validcid(index)) {
            const member = this.getMember(index)
            if (!!member && !!member.id) {
                const conditions = this.getConditions(member.id)

                if (!!conditions && conditions.length > 0) {
                    const dying = conditions.find(c => c.type.toLowerCase() == 'dying')
                    
                    if (!!dying) {
                        this.emit('DyingCheck', {valid: true, index: index})
                    } else {
                        this.emit('DyingCheck', {valid: false})
                    }
                }
            }
        }
    }
    _processMemberConditions(index) {
        if (!!this._validcid(index)) {
            const member = this.getMember(index)
            if (!!member && !!member.id) {
                const conditions = this.getConditions(member.id)

                if (!!conditions && conditions.length > 0) {
                    let newConditions = []
                    let removedConditions = []
                    let persistentDamageCheck = false
                    
                    conditions.forEach((condition) => {
                        if (!!condition) {
                            let currentCondition = {...condition}

                            if (!!currentCondition.duration) {
                                currentCondition.duration -= 1
                            }

                            if (!!currentCondition.reduce) {
                                currentCondition.value = !!currentCondition.floor ? Math.max(currentCondition.value - 1, 1) : currentCondition.value - 1
                            }

                            if (currentCondition.type.toLowerCase() == 'persistent damage') {
                                persistentDamageCheck = true
                            }

                            if ((!!currentCondition.duration || (!currentCondition.duration && currentCondition.duration != 0)) && (!!currentCondition.value || (!currentCondition.value && currentCondition.value != 0))) {
                                newConditions.push({...currentCondition})
                            } else {
                                removedConditions.push({...currentCondition})
                            }
                        }
                    })

                    if (!!removedConditions && removedConditions.length > 0) {
                        removedConditions.forEach(rc => {
                            const linked = this.$rsd.conditions.getConditionsLinkedRecursive(rc.type.toLowerCase())
                                
                            linked.forEach(l => {
                                const cindex = newConditions.findIndex(c => c.type.toLowerCase() == l.type.toLowerCase())
                                if (cindex != -1) {
                                    newConditions.splice(cindex, 1)
                                }
                            })

                            if (!!newConditions && newConditions.length > 0) {
                                newConditions.forEach(c => {
                                    this._addMissingLinked(c.type, newConditions)
                                })
                            }
                        })
                    }

                    if (!!persistentDamageCheck) {
                        // TODO: Do the persistent damage to the combatant, and only increase dying by 1 even if there are multiple

                        this.emit('PersistentDamageCheck', {valid: true, index: index})
                    } else {
                        this.emit('PersistentDamageCheck', {valid: false})
                    }

                    CombatService.updateCombatMembersConditionsById(member.id, newConditions)
                }
            }
        }
    }
    _processMemberAlerts(index) {
        if (!!this._validcid(index)) {
            const member = this.getMember(index)
            if (!!member && !!member.id && !!this.memberAlerts && !!this.memberAlerts[member.id]) {
                let newMemberAlerts = []

                this.memberAlerts[member.id].forEach((alert, index) => {
                    if (alert.round <= this.round) {
                        let eventhistory = {
                            identifier: this.getIdentifier(member),
                            event: {
                                short: `Alert (round ${this.round}): ${alert.title}`,
                                full: `Alert (round ${this.round}): ${alert.description}`,
                            }
                        }
                        
                        this.$rsd.eventhistory.push(eventhistory)

                        if (!alert.remove) {
                            newMemberAlerts.push(alert)
                        }
                    } else {
                        newMemberAlerts.push(alert)
                    }
                })


                if (JSON.stringify(this.memberAlerts[member.id]) != JSON.stringify(newMemberAlerts)) {
                    const memberAlertsArray = {...this.memberAlerts}
                    memberAlertsArray[member.id] = newMemberAlerts
                    CombatService.updateCombatMembersAlerts(memberAlertsArray)
                }
            }
        }
    }
    _processRoundAlerts() {
        if (!!this.roundAlerts) {
            let newRoundAlerts = []

            this.roundAlerts.forEach((alert, index) => {
                if (alert.round <= this.round) {
                    let eventhistory = {
                        identifier: 'Round',
                        event: {
                            short: `Alert (round ${this.round}): ${alert.title}`,
                            full: `Alert (round ${this.round}): ${alert.description}`,
                        }
                    }
                    
                    this.$rsd.eventhistory.push(eventhistory)

                    if (!alert.remove) {
                        newRoundAlerts.push(alert)
                    }
                } else {
                    newRoundAlerts.push(alert)
                }
            })


            if (JSON.stringify(this.roundAlerts) != JSON.stringify(newRoundAlerts)) {
                CombatService.updateCombatAlerts(newRoundAlerts)
            }
        }
    }

    useEncounter(encounterMembers) {
        if (!!encounterMembers && !!encounterMembers.length > 0) {
            encounterMembers.forEach(em => {
                const modifier = !!em.adj && em.adj != 'normal' ? (em.adj == 'weak' ? -2 : 2) : 0
                em.hp = this.$rsd.bestiary.getHP(em.bid, modifier)
                em.name = !!em.name ? em.name : this.$rsd.bestiary.getName(em.bid)
            })

            const loaded = CombatService.useEncounterAlt(encounterMembers, this.CompareInitiative)

            if (!!loaded) {
                this.$store.dispatch('rsd/setCombatState', true)
            }
        }
    }

    CompareInitiative(a,b) {
        let a_val = !!Number(a.initiative) ? Number(a.initiative) : null
        let b_val = !!Number(b.initiative) ? Number(b.initiative) : null
        let a_type = !!a.type ? a.type : null
        let b_type = !!b.type ? b.type : null

        if (!a_val && !b_val) {
            return 1
        } else if (!!a_val && !!b_val && a_val < b_val) {
            return 1
        } else if (!!a_val && !!b_val && a_val == b_val) {
            if (!a_type && !b_type) {
                return 1
            } else if (!!a_type && !!b_type) {
                if (a_type == b_type) {
                    return 1
                } else {
                    if (b_type == 'npc' || b_type == 'hazard') {
                        return 1
                    } else if ((a_type == 'gmc' && b_type == 'pc') || (b_type == 'gmc' && a_type == 'pc')) {
                        return 1
                    } else {
                        return -1
                    }
                }
            }
        } else {
            return -1
        }
    }

    getTotalDamage(damage, healthInfo) {
        let totalDamage = 0
        if (!!healthInfo) {
            damage.forEach(data => {
                // totalDamage += data.value

                const immunity = !!healthInfo.immunities ? healthInfo.immunities.includes(data.dmg.toLowerCase()) : null
                const resistance = !!healthInfo.resistances ? healthInfo.resistances.find(r => r.type.toLowerCase() == data.dmg.toLowerCase()) : null
                const weakness = !!healthInfo.weaknesses ? healthInfo.weaknesses.find(r => r.type.toLowerCase() == data.dmg.toLowerCase()) : null

                if (!immunity && !!resistance) {
                    const rValue = Number(resistance.value)
                    totalDamage += Math.max(data.value - rValue, 0)
                } else if (!immunity && !!weakness) {
                    const wValue = Number(weakness.value)
                    totalDamage += (data.value + wValue)
                } else if (!immunity) {
                    totalDamage += data.value
                }
            })
        } else {
            damage.forEach(data => {
                totalDamage += data.value
            })
        }
        return totalDamage
    }

    _addMissingLinked(newType, newConditions) {
        let newLinked = this.$rsd.conditions.getConditionsUnAndLinkedRecursive(newType.toLowerCase())

        // TODO: Distinguish between linked / unlinked and add 'linked' boolean to them?
        if (!!newLinked && newLinked.length > 0) {
            newLinked.forEach(l => {
                const alreadyApplied = newConditions.find(nc => nc.type.toLowerCase() == l.type.toLowerCase())
                if (!alreadyApplied) {
                    newConditions.push({...l, id: this.$rsd.random.getRandomUID(20)})
                }
            })
        }
    }

    _sortMembersArray(array) {
        return array.sort(this.CompareInitiative)
    }

    _fixMembersArrayInitiative(newArray, draggedObject) {
        if (!!newArray && newArray.length > 1 && !!draggedObject && !!draggedObject.id) {
            let newIndex = newArray.findIndex(na => na.id == draggedObject.id)

            if (newIndex != -1) {
                if (newIndex == 0) { // Is now start of the init list
                    newArray[newIndex].initiative = newArray[newIndex+1].initiative
                } else if (newIndex == newArray.length -1 ) { // Is now end of the init list
                    newArray[newIndex].initiative = newArray[newIndex-1].initiative
                } else { // Is now in the middle of the init list
                    newArray[newIndex].initiative = Math.floor((newArray[newIndex-1].initiative + newArray[newIndex+1].initiative)/2)
                }
            }
        }

        return newArray
    }
}