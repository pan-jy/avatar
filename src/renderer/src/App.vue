<template>
  <main>
    <nav>
      <span class="text-lg text-blue-400 font-bold">Avatar</span>
      <ul class="nav">
        <li>
          <a href="#">
            <i class="fa fa-house nav-icon"></i>
            <span class="nav-text">Home</span>
          </a>
        </li>

        <li class="nav-item">
          <a href="#">
            <i class="fa fa-user nav-icon"></i>
            <span class="nav-text">Profile</span>
          </a>
        </li>

        <li class="nav-item">
          <a href="#">
            <i class="fa fa-calendar-check nav-icon"></i>
            <span class="nav-text">Schedule</span>
          </a>
        </li>

        <li class="nav-item">
          <a href="#">
            <i class="fa fa-person-running nav-icon"></i>
            <span class="nav-text">Activities</span>
          </a>
        </li>

        <li class="nav-item">
          <a href="#">
            <i class="fa fa-sliders nav-icon"></i>
            <span class="nav-text">Settings</span>
          </a>
        </li>
      </ul>
    </nav>

    <section class="content">
      <Home />
    </section>
  </main>
</template>

<script setup lang="ts"></script>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
