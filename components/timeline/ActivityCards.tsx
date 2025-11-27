import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DiaperChangeRecord } from '@/database/diaper';
import { DiaryEntryRecord } from '@/database/diary';
import { FeedingRecord } from '@/database/feeding';
import { GrowthRecord } from '@/database/growth';
import { HealthRecord } from '@/database/health';
import { PumpingRecord } from '@/database/pumping';
import { SleepSessionRecord } from '@/database/sleep';

const CardContainer = ({
    children,
    icon,
    color,
}: {
    children: React.ReactNode;
    icon: React.ReactNode;
    color: string;
}) => (
    <View style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>{icon}</View>
        <View style={styles.contentContainer}>{children}</View>
    </View>
);

export const DiaperCard = ({ data }: { data: DiaperChangeRecord }) => {
    const isWet = data.kind === 'wet' || data.kind === 'mixed';
    const isDirty = data.kind === 'soiled' || data.kind === 'mixed';

    return (
        <CardContainer
            color="#E0F2F1"
            icon={<MaterialCommunityIcons name="baby-face-outline" size={24} color="#00695C" />}
        >
            <Text style={styles.title}>Diaper Change</Text>
            <View style={styles.row}>
                {isWet && <Text style={styles.detail}>💧 Wet</Text>}
                {isDirty && <Text style={styles.detail}>💩 Dirty</Text>}
                {data.color && (
                    <View style={[styles.colorDot, { backgroundColor: getColorHex(data.color) }]} />
                )}
            </View>
            {data.notes && <Text style={styles.notes}>{data.notes}</Text>}
        </CardContainer>
    );
};

export const FeedingCard = ({ data }: { data: FeedingRecord }) => {
    const isBottle = data.type === 'bottle';
    const isBreast = data.type === 'breast';

    let details = '';
    if (isBreast) {
        if (data.leftDuration != null && data.rightDuration != null) {
            details = `L: ${Math.round(data.leftDuration / 60)}m, R: ${Math.round(data.rightDuration / 60)}m`;
        } else if (data.leftDuration != null) {
            details = `Left: ${Math.round(data.leftDuration / 60)}m`;
        } else if (data.rightDuration != null) {
            details = `Right: ${Math.round(data.rightDuration / 60)}m`;
        }
    }

    const rowItems: React.ReactNode[] = [];
    if (data.amountMl != null) {
        rowItems.push(<Text key="amountMl" style={styles.detail}>{data.amountMl} ml</Text>);
    }
    if (data.amountGrams != null) {
        rowItems.push(<Text key="amountGrams" style={styles.detail}>{data.amountGrams} g</Text>);
    }
    if (data.duration != null) {
        rowItems.push(<Text key="duration" style={styles.detail}>{Math.round(data.duration / 60)} mins</Text>);
    }
    if (details !== '') {
        rowItems.push(<Text key="details" style={styles.detail}>{details}</Text>);
    }

    return (
        <CardContainer
            color="#FFF3E0"
            icon={<MaterialCommunityIcons name="baby-bottle-outline" size={24} color="#EF6C00" />}
        >
            <Text style={styles.title}>
                {isBottle ? 'Bottle Feeding' : isBreast ? 'Breast Feeding' : 'Solids'}
            </Text>
            {rowItems.length > 0 && (
                <View style={styles.row}>
                    {rowItems}
                </View>
            )}
            {data.ingredient && <Text style={styles.detail}>{data.ingredient}</Text>}
            {data.notes && <Text style={styles.notes}>{data.notes}</Text>}
        </CardContainer>
    );
};

export const SleepCard = ({ data }: { data: SleepSessionRecord }) => {
    const durationMins = data.duration ? Math.round(data.duration / 60) : 0;
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;

    return (
        <CardContainer
            color="#E8EAF6"
            icon={<Ionicons name="moon-outline" size={24} color="#283593" />}
        >
            <Text style={styles.title}>Sleep ({data.kind})</Text>
            <Text style={styles.detail}>
                {hours > 0 ? `${hours}h ` : ''}
                {mins}m
            </Text>
            {data.notes && <Text style={styles.notes}>{data.notes}</Text>}
        </CardContainer>
    );
};

export const GrowthCard = ({ data }: { data: GrowthRecord }) => {
    return (
        <CardContainer
            color="#F3E5F5"
            icon={<MaterialCommunityIcons name="ruler" size={24} color="#6A1B9A" />}
        >
            <Text style={styles.title}>Growth Measurement</Text>
            <View style={styles.row}>
                {data.weightKg != null && <Text style={styles.detail}>{data.weightKg} kg</Text>}
                {data.heightCm != null && <Text style={styles.detail}>{data.heightCm} cm</Text>}
                {data.headCircumferenceCm != null && <Text style={styles.detail}>Head: {data.headCircumferenceCm} cm</Text>}
            </View>
            {data.notes && <Text style={styles.notes}>{data.notes}</Text>}
        </CardContainer>
    );
};

export const HealthCard = ({ data }: { data: HealthRecord }) => {
    return (
        <CardContainer
            color="#FFEBEE"
            icon={<MaterialCommunityIcons name="medical-bag" size={24} color="#C62828" />}
        >
            <Text style={styles.title}>Health - {data.type}</Text>
            <View style={styles.row}>
                {data.temperature != null && <Text style={styles.detail}>{data.temperature}°C</Text>}
                {data.medicineType && <Text style={styles.detail}>{data.medicineType}</Text>}
                {data.medication && <Text style={styles.detail}>{data.medication}</Text>}
            </View>
            {data.symptoms && <Text style={styles.notes}>Symptoms: {data.symptoms}</Text>}
            {data.notes && <Text style={styles.notes}>{data.notes}</Text>}
        </CardContainer>
    );
};

export const PumpingCard = ({ data }: { data: PumpingRecord }) => {
    let details = '';
    if (data.leftAmountMl && data.rightAmountMl) {
        details = `L: ${data.leftAmountMl}ml, R: ${data.rightAmountMl}ml`;
    } else if (data.leftAmountMl) {
        details = `Left: ${data.leftAmountMl}ml`;
    } else if (data.rightAmountMl) {
        details = `Right: ${data.rightAmountMl}ml`;
    }

    return (
        <CardContainer
            color="#E1F5FE"
            icon={<MaterialCommunityIcons name="pump" size={24} color="#0277BD" />}
        >
            <Text style={styles.title}>Pumping</Text>
            <View style={styles.row}>
                {data.amountMl != null && <Text style={styles.detail}>Total: {data.amountMl} ml</Text>}
                {data.duration != null && <Text style={styles.detail}>{Math.round(data.duration / 60)} mins</Text>}
                {details ? <Text style={styles.detail}>{details}</Text> : null}
            </View>
            {data.notes && <Text style={styles.notes}>{data.notes}</Text>}
        </CardContainer>
    );
};

export const DiaryCard = ({ data }: { data: DiaryEntryRecord }) => {
    return (
        <CardContainer
            color="#FFF8E1"
            icon={<MaterialCommunityIcons name="book-open-variant" size={24} color="#FF8F00" />}
        >
            <Text style={styles.title}>{data.title || 'Diary Entry'}</Text>
            <Text style={styles.notes} numberOfLines={3}>
                {data.content}
            </Text>
            {data.photoUri && (
                <Text style={styles.detail}>📷 1 photo</Text>
            )}
        </CardContainer>
    );
};

function getColorHex(colorName: string | null) {
    switch (colorName) {
        case 'yellow': return '#FFEB3B';
        case 'brown': return '#795548';
        case 'olive_green': return '#556B2F';
        case 'dark_green': return '#006400';
        case 'red': return '#F44336';
        case 'black': return '#000000';
        case 'white': return '#FFFFFF';
        default: return 'transparent';
    }
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
    },
    detail: {
        fontSize: 14,
        color: '#666',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    notes: {
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 4,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
    },
});
