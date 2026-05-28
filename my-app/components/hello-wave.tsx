import { Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export function HelloWave() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    rotation.value = withRepeat(
      withSequence(withTiming(25, { duration: 150 }), withTiming(0, { duration: 150 })),
      4,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (Platform.OS === 'web') {
    return (
      <Animated.Text
        style={{
          fontSize: 28,
          lineHeight: 32,
          marginTop: -6,
          animationName: {
            '50%': { transform: [{ rotate: '25deg' }] },
          },
          animationIterationCount: 4,
          animationDuration: '300ms',
        }}>
        👋
      </Animated.Text>
    );
  }

  return (
    <Animated.Text style={[{ fontSize: 28, lineHeight: 32, marginTop: -6 }, animatedStyle]}>
      👋
    </Animated.Text>
  );
}
