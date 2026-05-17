import React, { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { ACCOUNT_OVERVIEW_SCREEN, fillPlaceholders } from "../../content/appContent";
import { ACCOUNT_NESTED } from "../../navigation/accountRoutes";
import { fonts } from "../../theme/tokens";

const copy = ACCOUNT_OVERVIEW_SCREEN.profileCompleteness;

function ProfileCompletenessMeterBase({ percent, missing, navigation }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const complete = percent >= 100;

  if (complete) {
    return (
      <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.body.fontSize, color: semanticPalette.success }}>
        {copy.completeLine}
      </Text>
    );
  }

  return (
    <View style={{ gap: SPACING.sm }}>
      <View
        style={{
          height: 4,
          borderRadius: RADII.pill,
          backgroundColor: semanticPalette.lineSoft,
          overflow: "hidden",
        }}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percent }}
      >
        <View
          style={{
            width: `${percent}%`,
            height: "100%",
            backgroundColor: semanticPalette.accent,
            borderRadius: RADII.pill,
          }}
        />
      </View>
      <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.inkSoft }}>
        {fillPlaceholders(copy.percentTemplate, { percent: String(percent) })}
      </Text>
      {missing.length ? (
        <View style={{ gap: 4 }}>
          {missing.slice(0, 4).map((item) => (
            <Pressable
              key={item.key}
              onPress={() => navigation.navigate(ACCOUNT_NESTED[item.route] || ACCOUNT_NESTED.AccountProfile)}
              accessibilityRole="link"
            >
              <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.caption.fontSize, color: semanticPalette.accent }}>
                {fillPlaceholders(copy.missingLinkTemplate, { label: item.label })}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const ProfileCompletenessMeter = memo(ProfileCompletenessMeterBase);
export default ProfileCompletenessMeter;
