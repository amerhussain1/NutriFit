import React from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
} from 'react-native';
const { width } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
type Props = {
    totalSteps: number;
    currentStep: number;
};
const ProgressSteps = ({
    totalSteps,
    currentStep,
}: Props) => {
    return (
        <View style={styles.container}>
            {Array.from({ length: totalSteps }).map((_, index) => {
                const active = index + 1 <= currentStep;
                return (
                    <View
                        key={index}
                        style={[
                            styles.step,
                            active
                                ? styles.activeStep
                                : styles.inactiveStep,
                        ]}
                    />
                );
            })}
        </View>
    );
};
export default ProgressSteps;
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        gap: wp(2),
    },
    step: {
        height: 6,
        borderRadius: 20,
    },
    activeStep: {
        width: wp(10),
        backgroundColor: '#FF6B00',
    },
    inactiveStep: {
        width: wp(3),
        backgroundColor: '#E5E7EB',
    },
});