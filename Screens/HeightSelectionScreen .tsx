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
type NavProps = NativeStackNavigationProp<
    RootStackParamList,
    'HeightSelectionScreen'
>;
const { width, height } = Dimensions.get('window');
// Responsive Helpers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
const HeightSelectionScreen = () => {
   const navigation = useNavigation<NavProps>();
    const [heightValue, setHeightValue] = useState(170);
    const getCategory = () => {
        if (heightValue < 155) return 'Short';
        if (heightValue < 180) return 'Average';
        return 'Tall';
    };
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#FFFCF8"
            />
            {/* Background */}
            <LinearGradient
                colors={['#FFF8F1', '#FFF4E6', '#FFFBEA']}
                style={styles.gradient}
            >
                {/* Header */}
                <AppBar title=" Height Selection" />
                <ProgressSteps totalSteps={7} currentStep={3} />
                <View>
                    <Text style={styles.subtitle}>
                        Height helps us calculate BMI and body fat percentage
                    </Text>
                </View>
                {/* Main Card */}
                <View style={styles.card}>
                    <Text style={styles.label}>
                        Current Height
                    </Text>
                    {/* Height Value */}
                    <View style={styles.heightRow}>
                        <Text style={styles.heightText}>
                            {heightValue}
                        </Text>
                        <Text style={styles.cm}>
                            cm
                        </Text>
                    </View>
                    {/* Category */}
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {getCategory()}
                        </Text>
                    </View>
                    {/* Slider */}
                    <View style={styles.sliderWrapper}>
                        <Slider
                            style={styles.slider}
                            minimumValue={120}
                            maximumValue={220}
                            step={1}
                            value={heightValue}
                            onValueChange={(value) =>
                                setHeightValue(value)
                            }
                            minimumTrackTintColor="#FF7A00"
                            maximumTrackTintColor="#FED7AA"
                            thumbTintColor="#FF8C42"
                        />
                        <View style={styles.rangeRow}>
                            <Text style={styles.rangeText}>
                                120cm
                            </Text>
                            <Text style={styles.rangeText}>
                                220cm
                            </Text>
                        </View>
                    </View>
                </View>
                {/* Info Cards */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoCard}>
                        <Text style={styles.emoji}>📏</Text>
                        <Text style={styles.infoTitle}>
                            BMI Analysis
                        </Text>
                        <Text style={styles.infoDesc}>
                            Accurate body mass calculations
                        </Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.emoji}>⚡</Text>
                        <Text style={styles.infoTitle}>
                            Fat %
                        </Text>
                        <Text style={styles.infoDesc}>
                            Smart AI body fat estimation
                        </Text>
                    </View>
                </View>
                {/* Continue Button */}
             <TouchableOpacity
                                 activeOpacity={0.85}
                                 style={styles.buttonContainer}
                                 onPress={() => navigation.navigate('AgeSelectionScreen')}
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
export default HeightSelectionScreen;
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
    heightRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginTop: hp(2),
    },
    heightText: {
        fontSize: wp(20),
        color: '#111827',
        fontWeight: '900',
        lineHeight: hp(12),
    },
    cm: {
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