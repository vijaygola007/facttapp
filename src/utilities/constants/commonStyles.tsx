import { StyleSheet } from 'react-native';

import { colors } from './colors';

const commonStyles = StyleSheet.create({
    shadow: {
        shadowOffset: { width: 2, height: 2, },
        shadowColor: '#000000',
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 3
    },
    capsText: {
        textTransform: 'uppercase'
    },
});

export { commonStyles };
