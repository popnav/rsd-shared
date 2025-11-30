<template>
    <div 
        v-if="!!visible"
        class="d-flex flex-column pa-2 width-100 view-space"    
    >
        <div class="d-flex flex-row align-center text-uppercase">
            <div class="d-flex flex-column">
                <span class="text-h6 roboto-condensed">Party Overview</span>
            </div>
            <v-spacer></v-spacer>
            <div class="text-h6">
                <span>
                    {{ !!$rsd.playercharacters && !!$rsd.playercharacters.party && !!$rsd.playercharacters.party.name ? $rsd.playercharacters.party.name : ''}}
                    {{ !!$rsd.campaigns && !!$rsd.campaigns.active && !!$rsd.campaigns.active.name ? $rsd.campaigns.active.name : ''}}
                </span>
            </div>
        </div>

        <hr />

        <div class="fill-height view-space">
            <div class="d-flex flex-wrap alt-scrollbar party-overview" :class="!!rsd.darkmode ? 'theme--dark' : ''">
                <div 
                    v-for="(member, index) in membersArray"
                    class="col-md-12 col-lg-6 col-xl-4"
                >
                    <v-card class="ma-2">
                        <v-card-title>
                            <span>{{ member.name }}</span>
                            <span 
                                v-show="!!isBenched(member)" 
                                class="ml-1 mt-1 grey--text body-2"
                            >(benched)</span>
                            <v-spacer></v-spacer>
                            <v-chip label small class="primary text-uppercase ">{{ member.type }}</v-chip>
                        </v-card-title>
                        <v-card-subtitle>
                            
                        </v-card-subtitle>
                        <v-card-text class="px-7 pb-6">
                            <v-row v-if="!!member.object" class="font-weight-bold">
                                <span v-if="!!member.object.level" class="mr-1">
                                    Level {{ member.object.level }}
                                </span>
                                <span v-if="!!member.object.abc">
                                    {{ member.object.abc.a }}
                                    {{ member.object.abc.b }}
                                    {{ member.object.abc.c }}
                                </span>
                            </v-row>
                            <v-row v-if="!!member.stats">
                                <span class="mr-1" v-if="!!member.stats.ac">
                                    <span class="font-weight-medium mr-1">AC</span>
                                    <span :class="!!member.stats.ac.modified ? 'red--text font-weight-medium' : ''">{{member.stats.ac.value}};</span>
                                </span>
                                <span class="mr-1" v-if="!!member.stats.perception">
                                    <span class="font-weight-medium mr-1">Perception</span>
                                    <span
                                        :class="!!member.stats.perception.modified ? 'red--text font-weight-medium' : ''"
                                    >
                                        <span v-if="member.stats.perception.mod >= 0">+</span>
                                        <span>{{member.stats.perception.mod}};</span>
                                    </span>
                                </span>
                            </v-row>
                            <v-row v-if="!!member.stats">
                                <span class="mr-1" v-if="!!member.stats.fortitude">
                                    <span class="font-weight-medium mr-1">Fortitude</span>
                                    <span
                                        :class="!!member.stats.fortitude.modified ? 'red--text font-weight-medium' : ''"
                                    >
                                        <span v-if="member.stats.fortitude.value >= 0">+</span>
                                        <span>{{member.stats.fortitude.value}};</span>
                                    </span>
                                </span>
                                <span class="mr-1" v-if="!!member.stats.reflex">
                                    <span class="font-weight-medium mr-1">Reflex</span>
                                    <span
                                        :class="!!member.stats.reflex.modified ? 'red--text font-weight-medium' : ''"
                                    >
                                        <span v-if="member.stats.reflex.value >= 0">+</span>
                                        <span>{{member.stats.reflex.value}};</span>
                                    </span>
                                </span>
                                <span class="mr-1" v-if="!!member.stats.will">
                                    <span class="font-weight-medium mr-1">Will</span>
                                    <span
                                        :class="!!member.stats.will.modified ? 'red--text font-weight-medium' : ''"
                                    >
                                        <span v-if="member.stats.will.value >= 0">+</span>
                                        <span>{{member.stats.will.value}};</span>
                                    </span>
                                </span>
                            </v-row>
                            <v-row>
                                <v-progress-linear
                                    v-if="!!isGM || ((!!localCharacter && !!localCharacter.id && localCharacter.id == member.id) || (!!activeSettings && !!activeSettings.pchp && activeSettings.pchp != $rsd.settings.getIndex('pchp', 'none'))) && !!member.health && !!member.health.hp >= 0 && !!member.health.maxhp >= 0"
                                    :color="healthColor(member)"
                                    height="16"
                                    class="text-subtitle-2 mb-1"
                                    :value="!!isGM || (!!localCharacter && !!localCharacter.id && localCharacter.id == member.id) || activeSettings.pchp == $rsd.settings.getIndex('pchp', 'full') ? 
                                    100*((member.health.hp + (member.health.temphp || 0))/member.health.maxhp) : 100"
                                >
                                    <div v-show="!!isGM || (!!localCharacter && !!localCharacter.id && localCharacter.id == member.id) || activeSettings.pchp == $rsd.settings.getIndex('pchp', 'full')">
                                        <span class="mr-1">{{member.health.hp}}</span> 
                                        <span v-if="member.health.temphp > 0" class="mr-1">(+{{member.health.temphp}})</span>
                                        <span>/ {{member.health.maxhp}}</span>
                                    </div>
                                </v-progress-linear>
                            </v-row>
                            <v-row v-if="!!member.stats" class="align-center">
                                <transition-group name="condition" class="my-1 mx-0 row">
                                    <template v-for="(cvalue, cindex) in member.conditions">
                                        <v-col :key="'cindex-'+cindex" class="py-0 px-0 flex-grow-0">
                                            <v-card outlined>
                                                <ConditionIndicator :condition="cvalue" :label="false" />
                                            </v-card>
                                        </v-col>
                                    </template>
                                </transition-group>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { isGM  } from '@/services'
import ConditionIndicator from '@root/.shared/components/ConditionIndicator'

export default {
    components: {
        ConditionIndicator,
    },
    props: {
        visible: Boolean,
        localCharacter: Object,
    },
    computed: {
        membersArray() {
            let originalArray = this.$store.getters['remotedb/membersArray']

            if (!!originalArray && originalArray.length > 0) {
                originalArray.forEach((combatant, key) => {
                    if (!!combatant) {
                        const basestats = this.$rsd.members.getStats(combatant)
                        if (!!originalArray[key].health) {
                            originalArray[key].health.maxhp = !!basestats && !!basestats.maxhp ? basestats.maxhp : 1
                        }
                        
                        const object = this.$rsd.members.getObject(combatant)
                        const stats = this.$rsd.conditions.getStatsObject(combatant, basestats, combatant.conditions, object)

                        originalArray[key].identifier = this.$rsd.combat.getIdentifier(combatant, object)
                        originalArray[key].basestats = basestats
                        originalArray[key].object = object
                        originalArray[key].stats = stats
                    }
                })
            }

            return originalArray
        },
        campaignActiveBench() {
            return this.$store.getters['remotedb/campaignActiveBench']
        },
        isGM() {
            return isGM
        }
    },
    methods: {
        healthColor(combatant) {
            if (!!combatant && !!combatant.health) {
                const percentConstant = 100 / Math.max(combatant.health.maxhp, combatant.health.hp)
                const hpPercent = combatant.health.hp * percentConstant / 100
                return this.$rsd.format.getColorBlend('#c70000', '#15c700', hpPercent)
            }
        },
        isBenched(member) {
            if (!!member && !!member.type && !!this.campaignActiveBench) {
                if (member.type.toLowerCase() == 'gmc' && !!member.id) {
                    return this.campaignActiveBench.includes('GMC/' + member.id)
                } else if (member.type.toLowerCase() == 'pc' && !!member.uid && !!member.id) {
                    return this.campaignActiveBench.includes(member.uid + '/' + member.id)
                }
            } else {
                return false
            }
        }
    }
}
</script>

<style lang="less" scoped>
.party-overview {
    height: calc(~"100vh - 150px");
    overflow-y: scroll;
    overflow-x: clip;
}
.party-member-card {
    width: 25%;
}
</style>