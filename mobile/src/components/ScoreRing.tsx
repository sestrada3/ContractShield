import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const COLORS = {
  red: '#e05252',
  amber: '#e0993a',
  green: '#4caf7d',
  muted: 'rgba(255,255,255,0.1)',
  textPrimary: 'rgba(255,255,255,0.92)',
  textMuted: 'rgba(255,255,255,0.45)',
};

function getScoreColor(score: number): string {
  if (score < 4) return COLORS.red;
  if (score < 7) return COLORS.amber;
  return COLORS.green;
}

function getScoreLabel(score: number): string {
  if (score < 4) return 'Risky';
  if (score < 5.5) return 'Concerning';
  if (score < 7) return 'Moderate';
  return 'Very Fair';
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreRingProps {
  score: number;
  size?: number;
}

export default function ScoreRing({ score, size = 180 }: ScoreRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 10],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  const displayScore = animatedValue.interpolate({
    inputRange: [0, 10],
    outputRange: [0, score],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const center = size / 2;
  const strokeWidth = 10;

  return (
    <View style={[styles.container, { width: size, height: size + 32 }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={COLORS.muted}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* Animated score arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      {/* Score number overlaid in center */}
      <View style={[styles.centerContent, { width: size, height: size }]}>
        <AnimatedScoreText animatedValue={displayScore} color={color} score={score} />
      </View>

      {/* Label below ring */}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

interface AnimatedScoreTextProps {
  animatedValue: Animated.AnimatedInterpolation<number>;
  color: string;
  score: number;
}

function AnimatedScoreText({ animatedValue, color, score }: AnimatedScoreTextProps) {
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    const id = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value * 10) / 10);
    });
    return () => animatedValue.removeListener(id);
  }, [animatedValue]);

  return (
    <Text style={[styles.scoreNumber, { color }]}>
      {displayValue.toFixed(1)}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
