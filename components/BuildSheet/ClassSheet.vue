<template>
    <div v-if="!!current && !!current.object">
        <div>
            <BaseTraitChip 
                v-if="!!current.object.rarity && current.object.rarity != 'common'" 
                :trait="current.object.rarity" 
                :custom_class="$rsd.format.rarityColor(current.object.rarity)" 
            />
            <BaseTraitChip
                v-for="trait in current.object.traits" 
                :key="'trait-'+trait" 
                :trait="trait"
                :custom_class="$rsd.format.traitColor(trait)"
            />
        </div>
        <div>
            <span v-show="!!current.object.mechanics" class="alt-scrollbar dialog-description pa-2 d-flex flex-column">
                <span
                    v-for="(item, index) in current.object.mechanics"
                    :key="'node-'+index"
                >
                    <BaseItemNode :item="item" />
                </span>
            </span>
        </div>
    </div>
</template>

<script>
import BaseItemNode from '@root/.shared/components/base/BaseItemNode'
import BaseTraitChip from '@root/.shared/components/base/BaseTraitChip'
import BaseTraitText from '@root/.shared/components/base/BaseTraitText'

export default {
    components: {
        BaseItemNode,
        BaseTraitChip,
        BaseTraitText,
    },
    props: {
        current: Object,
    }
}
</script>