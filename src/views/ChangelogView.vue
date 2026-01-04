<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import changelog from '../../CHANGELOG.md?raw'
import 'github-markdown-css/github-markdown.css'
import '@/assets/markdown.css'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

const html = md.render(changelog)
</script>

<template>
  <article class="changelog markdown-body" v-html="html" />
</template>

<style scoped>
.changelog {
  @apply px-6 py-10 max-w-4xl mx-auto space-y-4 select-text;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.7;
}
</style>
