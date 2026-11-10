import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { RootStackParamList } from '../App';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
const { width, height } = Dimensions.get('window');
type NavProps = NativeStackNavigationProp<
    RootStackParamList,
    'LoginScreen'
>;
const LoginScreen = () => {
    const navigation = useNavigation<NavProps>();
        useEffect(() => {
        GoogleSignin.configure({
            webClientId: 'YOUR_WEB_CLIENT_ID_FROM_FIREBASE',
            offlineAccess: true,
        });
    }, []);
    const handleGoogleLogin = async () => {
        navigation.navigate('GenderSelectionScreen');
        // try {
        //     await GoogleSignin.hasPlayServices();
        //     const userInfo = await GoogleSignin.signIn();
        //     console.log('User Info:', userInfo);
        // } catch (error: any) {
        //     if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        //         console.log('User cancelled login');
        //     } else {
        //         console.error(error);
        //     }
        // }
    };
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF8F1" />
            <LinearGradient
                colors={['#FFF8F1', '#FFF4E6', '#FFFBEA']}
                style={styles.content}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.brandName}>
                        NutriBudget <Text style={styles.accent}>AI</Text>
                    </Text>
                    <Text style={styles.tagline}>
                        SMART EATING, BIG SAVINGS
                    </Text>
                </View>
                {/* Illustration */}
                <Image
                    source={require('../assets/LoginLogo.png')}
                    style={styles.illustration}
                    resizeMode="contain"
                />
                {/* Buttons */}
                <View style={styles.bottomSection}>
                    {/* Login Button */}
                    <TouchableOpacity style={styles.loginButton}>
                        <Text style={styles.loginText}>Login</Text>
                    </TouchableOpacity>
                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.line} />
                        <Text style={styles.orText}>OR</Text>
                        <View style={styles.line} />
                    </View>
                    {/* Google Button */}
                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleLogin}
                    >
                        <Image
                            source={require('../assets/google_logo.png')}
                            style={styles.googleIcon}
                        />
                        <Text style={styles.googleText}>
                            Continue with Google
                        </Text>
                    </TouchableOpacity>
                    {/* Signup */}
                    <TouchableOpacity style={styles.signup}>
                        <Text style={styles.signupText}>
                            New here? <Text style={styles.signupBold}>Create Account</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
};
export default LoginScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8F1',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: width * 0.08,
        backgroundColor: '#FFF8F1',
    },
    header: {
        marginTop: height * 0.09,
        alignItems: 'center',
    },
    brandName: {
        fontSize: 50,
        fontWeight: '800',
        color: '#1F2937',
    },
    // Orange Accent
    accent: {
        color: '#FF7A00',
    },
    tagline: {
        marginTop: 6,
        fontSize: 16,
        color: '#7C7C7C',
        letterSpacing: 1,
    },
    illustration: {
        width: width * 0.90,
        height: height * 0.39,
        marginTop: height * 0.04,
    },
    bottomSection: {
        position: 'absolute',
        bottom: height * 0.2,
        width: '100%',
    },
    // Orange + Yellow Theme Button
    loginButton: {
        backgroundColor: '#FF7A00',
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#FF7A00',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    loginText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 22,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#FED7AA',
    },
    orText: {
        marginHorizontal: 10,
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '600',
    },
    // Google Button
    googleButton: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#FED7AA',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    googleText: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
    },
    signup: {
        marginTop: 20,
        alignItems: 'center',
    },
    signupText: {
        fontSize: 13,
        color: '#6B7280',
    },
    signupBold: {
        color: '#FF7A00',
        fontWeight: '700',
    },
});