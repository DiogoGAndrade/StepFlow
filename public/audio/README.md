# StepFlow Background Music

Place background music MP3 files in this directory. The player will attempt to load them during routines when music is enabled for the category.

## Expected filenames

| File | Used for |
|------|----------|
| `gym-energetic.mp3` | Gym / workout routines |
| `skincare-calm.mp3` | Skincare routines |
| `study-focus.mp3` | Study / pomodoro sessions |
| `tasks-calm.mp3` | Task / chore routines |
| `custom-calm.mp3` | Custom category routines |

## Notes

- Files must be placed directly in this `public/audio/` directory.
- The player looks for files at `/StepFlow/audio/<category>-<mood>.mp3`.
- If a file is missing, the player silently skips music (no errors shown to the user).
- Files loop automatically and volume is controlled by the Music settings in the Settings screen.
- Recommended: royalty-free looping tracks (60-120 BPM for gym, 40-70 BPM for calm/focus).
- Supported format: MP3. Files should be reasonably sized (< 10 MB recommended for PWA caching).

## Future

Music streaming or per-user uploads will be added in a future Appwrite phase.
See `docs/ROADMAP.md` for the full roadmap.
