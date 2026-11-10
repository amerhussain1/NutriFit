import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Animated, Dimensions, Image } from "react-native";
import BootSplash from "react-native-bootsplash";
import LinearGradient from "react-native-linear-gradient";
const { width, height } = Dimensions.get("window");
interface AnimatedSplashScreenProps {
    onAnimationEnd: () => void;
}
export const AnimatedSplashScreen = ({ onAnimationEnd }: AnimatedSplashScreenProps) => {
    // 1. Initialize animation values
    const logoScale = useRef(new Animated.Value(0.1)).current;
        const logoOpacity = useRef(new Animated.Value(0)).current;  // Start invisible
    const screenOpacity = useRef(new Animated.Value(1)).current;// Full opacity for the background
    useEffect(() => {
        BootSplash.hide({ fade: false });
        Animated.parallel([
            Animated.timing(logoScale, {
                toValue: 1.8, // increased size (from 1.3)
                duration: 1500, // same time
                useNativeDriver: true,
            }),
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 500, // same time
                useNativeDriver: true,
            }),
        ]).start(() => {
            setTimeout(() => {
                Animated.timing(screenOpacity, {
                    toValue: 0,
                    duration: 300, // same time
                    useNativeDriver: true,
                }).start(() => {
                    onAnimationEnd();
                });
            }, 800); // same time
        });
    }, []);
    return (
        <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
            <LinearGradient
                colors={["#FFF7D6", "#FFF7D6"]}
                style={styles.gradient}
            >
                <Animated.Image
                    source={require("../assets/appIcon.png")}
                    style={[
                        styles.logo,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                    resizeMode="contain"
                />
            </LinearGradient>
        </Animated.View>
    );
};
const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        zIndex: 99999,
    },
    gradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    logo: {
        width: width * 0.45,
        height: width * 0.45,
    },
});