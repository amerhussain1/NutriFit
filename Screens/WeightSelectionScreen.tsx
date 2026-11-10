import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AppBar from '../Component/AppBar';
import ProgressSteps from '../Component/ProgressSteps';
const { width, height } = Dimensions.get('window');
// Responsive Helpers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
type NavProps = NativeStackNavigationProp<
    RootStackParamList,
    'WeightSelectionScreen'
>;
const WeightSelectionScreen = () => {
    const navigation = useNavigation<NavProps>();
    const [weight, setWeight] = useState(70);
    const getCategory = () => {
        if (weight < 50) return 'Light';
        if (weight < 80) return 'Healthy';
        if (weight < 100) return 'Strong';
        return 'Heavy';
    };
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#FFFFFF"
            />
            {/* Background */}
            <LinearGradient
                colors={['#FFF8F1', '#FFF4E6', '#FFFBEA']}
                style={styles.gradient}
            >
                {/* Header */}
            <AppBar title=" Weight Selection " />
                <ProgressSteps totalSteps={7} currentStep={2} />
                <View>
                    <Text style={styles.subtitle}>
                        Personalized AI meal plans based on your body weight
                    </Text>
                </View>
                {/* Main Card */}
                <View style={styles.card}>
                    <Text style={styles.label}>
                        Current Weight
                    </Text>
                    {/* Weight Value */}
                    <View style={styles.weightRow}>
                        <Text style={styles.weight}>
                            {weight}
                        </Text>
                        <Text style={styles.kg}>
                            kg
                        </Text>
                    </View>
                    {/* Category Badge */}
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {getCategory()}
                        </Text>
                    </View>
                    {/* Slider */}
                    <View style={styles.sliderWrapper}>
                        <Slider
                            style={styles.slider}
                            minimumValue={30}
                            maximumValue={150}
                            step={1}
                            value={weight}
                            onValueChange={(value) => setWeight(value)}
                            minimumTrackTintColor="#FF7A00"
                            maximumTrackTintColor="#FED7AA"
                            thumbTintColor="#FF8C42"
                        />
                        <View style={styles.rangeRow}>
                            <Text style={styles.rangeText}>
                                30kg
                            </Text>
                            <Text style={styles.rangeText}>
                                150kg
                            </Text>
                        </View>
                    </View>
                </View>
                {/* Info Cards */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoCard}>
                        <Text style={styles.emoji}>🔥</Text>
                        <Text style={styles.infoTitle}>
                            Calories
                        </Text>
                        <Text style={styles.infoDesc}>
                            Smart daily calorie tracking
                        </Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.emoji}>🥗</Text>
                        <Text style={styles.infoTitle}>
                            Diet Plans
                        </Text>
                        <Text style={styles.infoDesc}>
                            AI-generated healthy meals
                        </Text>
                    </View>
                </View>
                {/* Continue Button */}
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.buttonContainer}
                    onPress={() => navigation.navigate('HeightSelectionScreen')}
                >
                    <LinearGradient
                        colors={['#FF7A00', '#FFC837']}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>
                            Continue
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </LinearGradient>
        </SafeAreaView>
    );
};
export default WeightSelectionScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFCF8',
    },
    gradient: {
        flex: 1,
        paddingHorizontal: wp(6),
    },
    header: {
        marginTop: hp(6),
        alignItems: 'center',
    },
    title: {
        fontSize: wp(8),
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
    },
    subtitle: {
        marginTop: hp(1.5),
        fontSize: wp(4),
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: hp(3),
        paddingHorizontal: wp(4),
    },
    card: {
        marginTop: hp(5),
        backgroundColor: '#FFFFFF',
        borderRadius: wp(7),
        paddingVertical: hp(4),
        paddingHorizontal: wp(6),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
    },
    label: {
        color: '#6B7280',
        fontSize: wp(4.3),
        textAlign: 'center',
    },
    weightRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginTop: hp(2),
    },
    weight: {
        fontSize: wp(20),
        color: '#111827',
        fontWeight: '900',
        lineHeight: hp(12),
    },
    kg: {
        fontSize: wp(7),
        color: '#FF7A00',
        fontWeight: '700',
        marginBottom: hp(1.5),
        marginLeft: wp(1),
    },
    badge: {
        alignSelf: 'center',
        marginTop: hp(1),
        backgroundColor: '#FF7A00',
        paddingHorizontal: wp(5),
        paddingVertical: hp(0.9),
        borderRadius: wp(10),
    },
    badgeText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: wp(3.5),
    },
    sliderWrapper: {
        marginTop: hp(4),
    },
    slider: {
        width: '100%',
        height: hp(5),
    },
    rangeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: hp(0.5),
    },
    rangeText: {
        color: '#6B7280',
        fontSize: wp(3.3),
        fontWeight: '600',
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: hp(4),
    },
    infoCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: wp(5),
        paddingVertical: hp(3),
        paddingHorizontal: wp(3),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 4,
    },
    emoji: {
        fontSize: wp(9),
        marginBottom: hp(1),
    },
    infoTitle: {
        color: '#111827',
        fontSize: wp(4.2),
        fontWeight: '700',
    },
    infoDesc: {
        color: '#6B7280',
        fontSize: wp(3.2),
        textAlign: 'center',
        marginTop: hp(1),
        lineHeight: hp(2.2),
    },
    buttonContainer: {
        position: 'absolute',
        bottom: hp(5),
        left: wp(6),
        right: wp(6),
    },
    button: {
        paddingVertical: hp(2.2),
        borderRadius: wp(5),
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: wp(4.5),
        fontWeight: '800',
    },
});