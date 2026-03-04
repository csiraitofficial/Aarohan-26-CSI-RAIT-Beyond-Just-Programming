import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LanguageCode } from '../../i18n/translations';
import { useLanguage } from '../../context/LanguageContext';

const options: LanguageCode[] = ['en', 'hi'];

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.row}>
      {options.map((code) => {
        const active = language === code;
        return (
          <Pressable
            key={code}
            onPress={() => setLanguage(code)}
            style={[styles.chip, active && styles.activeChip]}
          >
            <Text style={[styles.text, active && styles.activeText]}>{code.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10
  },
  chip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF'
  },
  activeChip: {
    backgroundColor: '#E0ECFF',
    borderColor: '#0A84FF'
  },
  text: {
    color: '#374151',
    fontWeight: '600'
  },
  activeText: {
    color: '#0A84FF'
  }
});