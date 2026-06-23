#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const usage = () => {
  console.error('Usage: node .agents/skills/test-user-story/references/generate-report.js <evidence-dir>/report-data.json');
  process.exit(1);
};

const dataPath = process.argv[2];
if (!dataPath) usage();

const absoluteDataPath = path.resolve(dataPath);
const evidenceDir = path.dirname(absoluteDataPath);
const templatePath = path.join(__dirname, 'report.html');
const outputPath = path.join(evidenceDir, 'index.html');

const data = JSON.parse(fs.readFileSync(absoluteDataPath, 'utf8'));
const template = fs.readFileSync(templatePath, 'utf8');

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const templateById = (id) => {
  const match = template.match(new RegExp(`<template id="${id}">([\\s\\S]*?)<\\/template>`));
  if (!match) throw new Error(`Missing template: ${id}`);
  return match[1].trim();
};

const replaceAll = (source, replacements) => Object.entries(replacements)
  .reduce((text, [key, value]) => text.split(key).join(value ?? ''), source);

const statusClass = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'PASS') return 'status-badge-pass';
  if (normalized === 'FAIL') return 'status-badge-fail';
  return 'status-badge-skipped';
};

const evidenceDetails = (testCase, index) => {
  const evidenceFile = testCase.evidence || '';
  const noEvidence = {
    evidenceFile,
    evidenceMedia: '<div class="w-full h-full flex items-center justify-center text-white/80 font-body-sm">No evidence captured</div>',
    playIconVisibility: 'hidden',
  };

  if (!evidenceFile) return noEvidence;

  const ext = path.extname(evidenceFile).toLowerCase();
  if (['.webm', '.mp4', '.mov'].includes(ext)) {
    return {
      evidenceFile,
      evidenceMedia: replaceAll(videoTemplate, { '{{EVIDENCE_SRC}}': escapeHtml(evidenceFile) }),
      playIconVisibility: '',
    };
  }

  return {
    evidenceFile,
    evidenceMedia: replaceAll(imageTemplate, {
      '{{EVIDENCE_SRC}}': escapeHtml(evidenceFile),
      '{{EVIDENCE_ALT}}': escapeHtml(`${testCase.name || `Case ${index + 1}`} evidence`),
    }),
    playIconVisibility: 'hidden',
  };
};

const failureDetails = (testCase, index) => {
  if (String(testCase.status || '').toUpperCase() !== 'FAIL') return '';

  const consoleErrors = (testCase.consoleErrors || []).length
    ? (testCase.consoleErrors || []).join('\n')
    : 'No JavaScript console errors captured at time of failure.';

  return replaceAll(caseFailureTemplate, {
    '{{CASE_FAILED_STEP}}': escapeHtml(testCase.failedStep || testCase.name || `Case ${index + 1}`),
    '{{CASE_EXPECTED}}': escapeHtml(testCase.expected || ''),
    '{{CASE_ACTUAL}}': escapeHtml(testCase.actual || ''),
    '{{CASE_CONSOLE_ERRORS_SECTION}}': replaceAll(caseConsoleTemplate, {
      '{{CASE_CONSOLE_ERRORS}}': escapeHtml(consoleErrors),
    }),
  });
};

const cardTemplate = templateById('test-case-card-template');
const stepTemplate = templateById('case-step-template');
const videoTemplate = templateById('video-evidence-template');
const imageTemplate = templateById('image-evidence-template');
const caseFailureTemplate = templateById('case-failure-details-template');
const caseConsoleTemplate = templateById('case-console-errors-template');

const cases = data.cases || [];
const cards = cases.map((testCase, index) => {
  const steps = (testCase.steps || [])
    .map((step, stepIndex) => replaceAll(stepTemplate, {
      '{{STEP_NUMBER}}': String(stepIndex + 1),
      '{{STEP_DESCRIPTION}}': escapeHtml(step),
    }))
    .join('\n');

  const evidence = evidenceDetails(testCase, index);

  return replaceAll(cardTemplate, {
    '{{CASE_NUMBER}}': String(testCase.number || index + 1),
    '{{CASE_NAME}}': escapeHtml(testCase.name || `Case ${index + 1}`),
    '{{CASE_GOAL}}': escapeHtml(testCase.goal || ''),
    '{{CASE_STATUS_CLASS}}': statusClass(testCase.status),
    '{{CASE_STATUS}}': escapeHtml(String(testCase.status || 'SKIPPED').toUpperCase()),
    '{{CASE_STEPS}}': steps,
    '{{CASE_FAILURE_DETAILS}}': failureDetails(testCase, index),
    '{{EVIDENCE_MEDIA}}': evidence.evidenceMedia,
    '{{EVIDENCE_PLAY_ICON_VISIBILITY}}': evidence.playIconVisibility,
    '{{EVIDENCE_FILENAME}}': escapeHtml(evidence.evidenceFile || '—'),
  });
}).join('\n');

const passedCases = data.passedCases ?? cases.filter((testCase) => String(testCase.status).toUpperCase() === 'PASS').length;
const totalCases = data.totalCases ?? cases.length;
const overallStatus = data.overallStatus || (passedCases === totalCases ? 'PASS' : 'FAILURE');

const reportWithoutTemplates = template.replace(/\n\s*<template id="[^"]+">[\s\S]*?<\/template>/g, '');
const report = replaceAll(reportWithoutTemplates, {
  '{{STORY_NAME}}': escapeHtml(data.storyName || 'User story'),
  '{{OVERALL_STATUS}}': escapeHtml(overallStatus),
  '{{OVERALL_STATUS_KEY}}': String(overallStatus).toLowerCase() === 'pass' ? 'pass' : 'failure',
  '{{ENVIRONMENT}}': escapeHtml(data.environment || ''),
  '{{ENVIRONMENT_URL}}': escapeHtml(data.environmentUrl || ''),
  '{{PASSED_CASES}}': String(passedCases),
  '{{TOTAL_CASES}}': String(totalCases),
  '{{TEST_CASE_CARDS}}': cards,
});

const remainingPlaceholders = report.match(/{{[^}]+}}/g);
if (remainingPlaceholders) {
  throw new Error(`Unresolved placeholders: ${[...new Set(remainingPlaceholders)].join(', ')}`);
}

for (const testCase of cases) {
  if (!testCase.evidence) continue;
  const evidencePath = path.join(evidenceDir, testCase.evidence);
  if (!fs.existsSync(evidencePath)) throw new Error(`Referenced evidence file does not exist: ${evidencePath}`);
}

fs.writeFileSync(outputPath, report);
console.log(outputPath);
