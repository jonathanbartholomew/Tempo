# Landing page follow-ups

## Tracing beam lines (horizontal scroll section)

- 9 straight "guitar string" lines added across the features section
  (`STRING_POSITIONS` in `src/components/auth/LoginScreen.jsx`), each with a
  static gray track plus a blue `motion.path` animated via
  `animate={{ pathLength: hProgress }}`.
- For now, made all lines more faint (`strokeOpacity` 0.5 track / 0.35 blue)
  as a stopgap.
- Outstanding issue: the blue "fill" does not appear to start from the left
  edge as `hProgress` increases from 0 - it shows up partway across the
  line instead. Needs investigation with the dev server + a browser
  (Playwright) to inspect the actual `stroke-dasharray`/`stroke-dashoffset`
  values on the `<path>` elements at low `hProgress` and figure out why the
  reveal isn't anchored to x=0.
