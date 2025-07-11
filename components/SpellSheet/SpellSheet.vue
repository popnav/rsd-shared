<template>
    <div 
        class="d-flex flex-column width-100 spell-sheet alt-scrollbar pa-2"
        v-if="!!spell && !!spell.system && !!visible"
        :class="containerClass"
    >
        <!-- Title -->
        <div class="d-flex flex-row align-center text-uppercase">
            <div class="d-flex flex-column">
                <span class="text-h6 roboto-condensed mb-n1">{{spell.name}}</span>
            </div>
            <v-spacer></v-spacer>
            <div class="text-h6">
                <span class="mr-1">{{spellType}}</span>
                <span>{{!!spell.system.level ? spell.system.level.value : 1}}</span>
            </div>
        </div>

        <hr />

        <!-- Traits -->
        <div v-if="!!spell.system.traits" class="d-flex flex-row flex-wrap my-1">
            <BaseTraitChip 
                v-if="!!spell.system.traits.rarity && spell.system.traits.rarity != 'common'" 
                :trait="spell.system.traits.rarity" 
                :custom_class="$rsd.format.rarityColor(spell.system.traits.rarity)" 
            />
            <BaseTraitChip 
                v-for="trait in spell.system.traits.value" 
                :key="'trait-'+trait" 
                :trait="trait"
                :custom_class="$rsd.format.traitColor(trait)"
            />
            <BaseTraitChip 
                v-if="!!spell.system.school" 
                :trait="spell.system.school.value"
                :custom_class="$rsd.format.otherLegacyColor(spell.system.school.value)"
            />
        </div>

        <!-- Header text -->
        <div class="d-flex flex-column">
            <span v-if="!!spell.system.source && !!spell.system.source.value">
                <span class="font-weight-bold mr-1">Source</span>
                <span>{{spell.system.source.value}}</span>
            </span>
            <StatsTraditions :traditions="spell.system.traditions" />
            <StatsCast 
                :castTime="!!spell.system.time && !!spell.system.time.value ? spell.system.time.value : null" 
                :components="spell.system.components"
                :materials="!!spell.system.materials && !!spell.system.materials.value ? spell.system.materials.value : null"
            />
            <StatsRangeTarget
                :area="!!spell.system.area && !!spell.system.area.value ? spell.system.area : null"
                :range="!!spell.system.range && !!spell.system.range.value ? spell.system.range.value : null" 
                :target="!!spell.system.target && !!spell.system.target.value ? spell.system.target.value : null"
            />
            <StatsDuration 
                :duration="!!spell.system.duration && !!spell.system.duration.value ? spell.system.duration.value : null"
                :save="!!spell.system.save && !!spell.system.save.value ? spell.system.save.value : null"
                :basicSave="!!spell.system.save && !!spell.system.save.basic ? !!spell.system.save.basic : null"
            />
            <StatsPrimaryCheck
                :primarycheck="!!spell.system.primarycheck && !!spell.system.primarycheck.value ? spell.system.primarycheck.value : null"
            />
        </div>

        <hr />

        <!-- Description -->
        <div class="d-flex flex-column" v-if="!!processedDescription">
            <span
                v-for="(item, index) in processedDescription"
                :key="'node-'+index"
            >
                <BaseItemNode :item="item" />
            </span>
            <!-- {{spell.system.parsedDescription}} -->
        </div>

    </div>
</template>

<script>
import { SpellService } from '@/services'

import BaseTraitChip from '@root/.shared/components/base/BaseTraitChip'
import BaseItemNode from '@root/.shared/components/base/BaseItemNode'

import StatsTraditions from './components/StatsTraditions.vue'
import StatsCast from './components/StatsCast.vue'
import StatsRangeTarget from './components/StatsRangeTarget.vue'
import StatsDuration from './components/StatsDuration.vue'
import StatsPrimaryCheck from './components/StatsPrimaryCheck.vue'

export default {
    components: {
        BaseTraitChip,
        BaseItemNode,
        StatsTraditions,
        StatsCast,
        StatsRangeTarget,
        StatsDuration,
        StatsPrimaryCheck,
    },
    data() {
        return {
        }
    },
    props: {
        spell: Object,
        containerClass: String,
        visible: Boolean,
    },
    computed: {
        spellType() {
            if (!!this.spell && !!this.spell.system) {
                let focusSort = ''

                if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('bard')) {
                    focusSort = 'composition '
                } else if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('psychic')) {
                    focusSort = 'psi '
                } else if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('sorcerer')){
                    focusSort = 'bloodline '
                } else if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('monk')) {
                    focusSort = 'ki '
                } else if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('oracle')) {
                    focusSort = 'revelation '
                } else if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('cleric')) {
                    focusSort = 'domain '
                } else if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('ranger')) {
                    focusSort = 'warden '
                } else if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('druid')) {
                    focusSort = 'order '
                } else if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('wizard')) {
                    focusSort = 'school '
                } else if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('witch')) {
                    focusSort = 'hex '
                } else if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('summoner')) {
                    focusSort = 'summoner '
                } else if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('magus')) {
                    focusSort = 'conflux '
                } else if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('champion')) {
                    focusSort = 'devotion '
                }
                
                if (!!this.spell.system.traits && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('cantrip')) {
                    return `${focusSort}cantrip`
                } else if (!!this.spell.system.category && !!this.spell.system.category.value) {
                    if (this.spell.system.category.value == 'focus') {
                        return `${focusSort}${this.spell.system.category.value} spell`
                    } else {
                        return this.spell.system.category.value
                    }
                } else {
                    return 'spell'
                }
            }
        },
        processedDescription() {
            let _parsedSpell = SpellService.parseSpell(this.spell)
            return !!this.spell && !!_parsedSpell && !!_parsedSpell.system && !!_parsedSpell.system.parsedDescription ? _parsedSpell.system.parsedDescription : null
        },
        isCantrip() {
            return !!this.spell && !!this.spell.system && !!this.spell.system.traits 
            && !!this.spell.system.traits.value && this.spell.system.traits.value.includes('cantrip')
        },
    },
    methods: {
    },
}
</script>

<style lang="less" scoped>
.spell-sheet {
    overflow-y: scroll;
    overflow-x: clip;
}
.spell-sheet p {
    margin-bottom: 0;
}
.full-column-view {
    width: calc(~"100vw - 48px");
    max-width: calc(~"100vw - 48px");
    height: calc(~"50vh - 40px");
    max-height: calc(~"50vh - 40px");
}
.column-view {
    width: calc(~"100vw - 500px");
    max-width: calc(~"100vw - 500px");
    height: calc(~"50vh - 40px");
    max-height: calc(~"50vh - 40px");
}

.mobile-view {
    width: 100%;
    max-width: 100%;
    height: calc(~"100vh - 144px");
    max-height: calc(~"100vh - 144px");
}
</style>

<style scoped>
div >>> .action {
    height: 24px;
    line-height: 1;
}
</style>