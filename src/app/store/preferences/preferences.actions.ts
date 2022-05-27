import { createAction, props } from '@ngrx/store';
import { Preferences, TableDisplayedColumns } from 'app/interfaces/preferences.interface';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';

export const preferencesLoaded = createAction('[Preferences API] Loaded', props<{ preferences: Preferences }>());
export const noPreferencesFound = createAction('[Preferences API] No Preferences Found');

// TODO: These actions will be moved elsewhere in the future
export const themeNotFound = createAction('[Preferences] Theme Not Found');
export const preferredColumnsUpdated = createAction(
  '[Preferences] Preferred Columns Updated',
  props<{ columns: TableDisplayedColumns[] }>(),
);
export const localizationFormSubmitted = createAction('[Preferences] Localization Form Submitted', props<{
  dateFormat: string;
  timeFormat: string;
}>());

export const builtinUsersToggled = createAction('[Preferences] Builtin Users Toggled');
export const builtinGroupsToggled = createAction('[Preferences] Builtin Groups Toggled');
export const snapshotExtraColumnsToggled = createAction('[Preferences] Snapshot Extra Columns Toggled');

export const themeChangedInGuiForm = createAction('[Preferences] Theme Changed In GUI Form', props<{ theme: string }>());
export const guiFormSubmitted = createAction('[Preferences] GUI Form Submitted', props<{ theme: string }>());
export const guiFormClosedWithoutSaving = createAction('[Preferences] GUI Form Closed Without Saving');

export const dashboardStateLoaded = createAction('[Preferences API] Dashboard State Loaded', props<{ dashboardState: DashConfigItem[] }>());
export const noDashboardStateFound = createAction('[Preferences API] No Dashboard State Found');

export const updateRebootAfterManualUpdate = createAction(
  '[Preferences] Reboot After Manual Update Option Updated',
  props<{ rebootAfterManualUpdate: boolean }>(),
);
