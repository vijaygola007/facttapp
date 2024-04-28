import React from 'react';
import { Text, TouchableOpacity, StyleSheet, } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

import { fonts } from '../../../assets';
import { colors } from '../../utilities/constants';

const Button = ({
    onPress,
    label,
    bgColor,
    containerStyle,
    marginTop,
    marginBottom,
    marginHorizontal,
    width,
    height,
    disabled
}) => (
        <TouchableOpacity
            activeOpacity={0.6}
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.button,
                {
                    height: height || moderateScale(44),
                    width: width || null,
                    backgroundColor: bgColor || '#2D635E',
                    marginTop: marginTop || 0,
                    marginBottom: marginBottom || 0,
                    marginHorizontal: marginHorizontal || 0,
                    opacity: disabled ? 0.6 : 1
                },
                containerStyle
            ]}
        >
            <Text style={styles.label}>
                {label}
            </Text>
        </TouchableOpacity>
    );

const styles = StyleSheet.create({
    button: {
        borderRadius: moderateScale(2),
        alignItems: 'center',
        justifyContent: 'center'
    },
    label: {
        color: colors.white1,
        fontSize: moderateScale(14),
        fontFamily: fonts.regular,
    },
});

export { Button };
