#!/usr/bin/env node

/**
 * 🎯 MASTER OAUTH UX TEST RUNNER
 * 
 * Chạy toàn bộ bộ test comprehensive cho OAuth pipeline:
 * - Continuous Auth Flow Test (50x login/logout)
 * - Stress Test Suite (concurrent, network, memory)
 * - Edge Case Suite (security, errors, recovery)
 * - Performance Monitoring
 * - UX Smoothness Analysis
 * 
 * Tạo báo cáo tổng hợp về chất lượng UX và độ tin cậy của OAuth flow
 */

const ContinuousAuthFlowTester = require('./continuous-auth-flow.test.js');
const OAuthStressTestSuite = require('./stress-test-suite.test.js');
const OAuthEdgeCaseTestSuite = require('./edge-case-suite.test.js');
const fs = require('fs');
const path = require('path');

class MasterOAuthTestRunner {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3001';
    this.iterations = options.iterations || 20;
    this.concurrentSessions = options.concurrentSessions || 3;
    this.results = {
      continuous: null,
      stress: null,
      edgeCase: null,
      overall: null
    };
    this.startTime = Date.now();
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️', header: '🎯' };
    console.log(`[${timestamp}] ${icons[type]} ${message}`);
  }

  async runContinuousAuthTests() {
    await this.log('Starting Continuous Auth Flow Tests...', 'header');
    
    const tester = new ContinuousAuthFlowTester({
      baseUrl: this.baseUrl,
      iterations: this.iterations
    });
    
    try {
      this.results.continuous = await tester.run();
      await this.log(`Continuous Auth Tests: ${this.results.continuous.successRate.toFixed(1)}% success rate`, 'success');
    } catch (error) {
      await this.log(`Continuous Auth Tests Failed: ${error.message}`, 'error');
      this.results.continuous = { successRate: 0, error: error.message };
    }
  }

  async runStressTests() {
    await this.log('Starting Stress Test Suite...', 'header');
    
    const tester = new OAuthStressTestSuite({
      baseUrl: this.baseUrl,
      concurrentSessions: this.concurrentSessions
    });
    
    try {
      this.results.stress = await tester.run();
      await this.log(`Stress Tests: ${this.results.stress.successRate.toFixed(1)}% success rate`, 'success');
    } catch (error) {
      await this.log(`Stress Tests Failed: ${error.message}`, 'error');
      this.results.stress = { successRate: 0, error: error.message };
    }
  }

  async runEdgeCaseTests() {
    await this.log('Starting Edge Case Test Suite...', 'header');
    
    const tester = new OAuthEdgeCaseTestSuite({
      baseUrl: this.baseUrl
    });
    
    try {
      this.results.edgeCase = await tester.run();
      await this.log(`Edge Case Tests: ${this.results.edgeCase.successRate.toFixed(1)}% success rate`, 'success');
    } catch (error) {
      await this.log(`Edge Case Tests Failed: ${error.message}`, 'error');
      this.results.edgeCase = { successRate: 0, error: error.message };
    }
  }

  calculateOverallScore() {
    const weights = {
      continuous: 0.4,  // 40% - Most important for UX
      stress: 0.35,     // 35% - Important for reliability
      edgeCase: 0.25    // 25% - Important for security
    };
    
    let totalScore = 0;
    let validTests = 0;
    
    if (this.results.continuous && this.results.continuous.successRate !== undefined) {
      totalScore += this.results.continuous.successRate * weights.continuous;
      validTests += weights.continuous;
    }
    
    if (this.results.stress && this.results.stress.successRate !== undefined) {
      totalScore += this.results.stress.successRate * weights.stress;
      validTests += weights.stress;
    }
    
    if (this.results.edgeCase && this.results.edgeCase.successRate !== undefined) {
      totalScore += this.results.edgeCase.successRate * weights.edgeCase;
      validTests += weights.edgeCase;
    }
    
    const overallScore = validTests > 0 ? totalScore / validTests : 0;
    
    // Calculate UX Quality Grade
    let grade, description;
    if (overallScore >= 95) {
      grade = 'A+';
      description = 'EXCEPTIONAL - Enterprise-grade OAuth UX';
    } else if (overallScore >= 90) {
      grade = 'A';
      description = 'EXCELLENT - Production-ready OAuth UX';
    } else if (overallScore >= 85) {
      grade = 'B+';
      description = 'VERY GOOD - Reliable OAuth UX with minor issues';
    } else if (overallScore >= 80) {
      grade = 'B';
      description = 'GOOD - Acceptable OAuth UX, some optimization needed';
    } else if (overallScore >= 70) {
      grade = 'C+';
      description = 'FAIR - OAuth UX needs improvement';
    } else if (overallScore >= 60) {
      grade = 'C';
      description = 'POOR - Significant OAuth UX issues';
    } else {
      grade = 'F';
      description = 'FAILING - OAuth UX unacceptable for production';
    }
    
    return {
      score: overallScore,
      grade,
      description,
      breakdown: {
        continuous: this.results.continuous?.successRate || 0,
        stress: this.results.stress?.successRate || 0,
        edgeCase: this.results.edgeCase?.successRate || 0
      }
    };
  }

  generateComprehensiveReport() {
    const totalDuration = Date.now() - this.startTime;
    const overall = this.calculateOverallScore();
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE OAUTH UX TEST REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📊 OVERALL RESULTS:`);
    console.log(`🏆 Overall Score: ${overall.score.toFixed(1)}/100`);
    console.log(`📋 Grade: ${overall.grade}`);
    console.log(`💬 Assessment: ${overall.description}`);
    console.log(`⏱️  Total Test Duration: ${Math.round(totalDuration / 1000)}s`);
    
    console.log(`\n📈 BREAKDOWN BY TEST SUITE:`);
    
    // Continuous Auth Flow Results
    if (this.results.continuous) {
      console.log(`\n🔄 CONTINUOUS AUTH FLOW (40% weight):`);
      console.log(`   Score: ${this.results.continuous.successRate?.toFixed(1) || 0}%`);
      console.log(`   Iterations: ${this.results.continuous.total || 0}`);
      console.log(`   Successful: ${this.results.continuous.successful || 0}`);
      console.log(`   Avg Time: ${this.results.continuous.avgTime?.toFixed(0) || 0}ms`);
      
      if (this.results.continuous.successRate >= 95) {
        console.log(`   ✅ EXCELLENT - Smooth continuous auth experience`);
      } else if (this.results.continuous.successRate >= 85) {
        console.log(`   ⚠️  GOOD - Minor issues with continuous auth`);
      } else {
        console.log(`   ❌ POOR - Significant continuous auth problems`);
      }
    }
    
    // Stress Test Results
    if (this.results.stress) {
      console.log(`\n💪 STRESS TEST SUITE (35% weight):`);
      console.log(`   Score: ${this.results.stress.successRate?.toFixed(1) || 0}%`);
      console.log(`   Tests: ${this.results.stress.totalTests || 0}`);
      console.log(`   Passed: ${this.results.stress.passedTests || 0}`);
      console.log(`   Health: ${this.results.stress.overallHealth || 'UNKNOWN'}`);
      
      if (this.results.stress.successRate >= 80) {
        console.log(`   ✅ ROBUST - Handles stress scenarios well`);
      } else if (this.results.stress.successRate >= 60) {
        console.log(`   ⚠️  ACCEPTABLE - Some stress vulnerabilities`);
      } else {
        console.log(`   ❌ VULNERABLE - Poor stress resistance`);
      }
    }
    
    // Edge Case Results
    if (this.results.edgeCase) {
      console.log(`\n🔍 EDGE CASE SUITE (25% weight):`);
      console.log(`   Score: ${this.results.edgeCase.successRate?.toFixed(1) || 0}%`);
      console.log(`   Security: ${this.results.edgeCase.securityScore || 0}/3`);
      console.log(`   Resilience: ${this.results.edgeCase.resilienceScore || 0}/4`);
      console.log(`   Health: ${this.results.edgeCase.overallHealth || 'UNKNOWN'}`);
      
      if (this.results.edgeCase.successRate >= 75) {
        console.log(`   ✅ SECURE - Excellent edge case handling`);
      } else if (this.results.edgeCase.successRate >= 60) {
        console.log(`   ⚠️  DECENT - Some edge case weaknesses`);
      } else {
        console.log(`   ❌ RISKY - Poor edge case protection`);
      }
    }
    
    // UX Quality Analysis
    console.log(`\n🎨 UX QUALITY ANALYSIS:`);
    
    const uxIssues = [];
    const uxStrengths = [];
    
    if (this.results.continuous?.successRate < 90) {
      uxIssues.push('Inconsistent login/logout experience');
    } else {
      uxStrengths.push('Reliable continuous authentication');
    }
    
    if (this.results.stress?.successRate < 80) {
      uxIssues.push('Poor performance under stress');
    } else {
      uxStrengths.push('Excellent stress resistance');
    }
    
    if (this.results.edgeCase?.securityScore < 2) {
      uxIssues.push('Security vulnerabilities detected');
    } else {
      uxStrengths.push('Strong security posture');
    }
    
    if (uxStrengths.length > 0) {
      console.log(`   ✅ STRENGTHS:`);
      uxStrengths.forEach(strength => console.log(`      • ${strength}`));
    }
    
    if (uxIssues.length > 0) {
      console.log(`   ⚠️  AREAS FOR IMPROVEMENT:`);
      uxIssues.forEach(issue => console.log(`      • ${issue}`));
    }
    
    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    
    if (overall.score >= 95) {
      console.log(`   🎉 Excellent work! OAuth UX is production-ready.`);
      console.log(`   📈 Consider documenting best practices for other teams.`);
    } else if (overall.score >= 85) {
      console.log(`   🚀 Good OAuth UX! Address minor issues before production.`);
      console.log(`   🔧 Focus on ${overall.breakdown.continuous < 90 ? 'continuous flow stability' : 
                      overall.breakdown.stress < 80 ? 'stress resistance' : 'edge case handling'}.`);
    } else if (overall.score >= 70) {
      console.log(`   ⚠️  OAuth UX needs improvement before production deployment.`);
      console.log(`   🎯 Priority: Fix continuous auth flow issues.`);
      console.log(`   🛡️  Secondary: Improve security and error handling.`);
    } else {
      console.log(`   🚨 CRITICAL: OAuth UX has major issues requiring immediate attention.`);
      console.log(`   🔴 Do NOT deploy to production until issues are resolved.`);
      console.log(`   🆘 Focus on basic auth flow stability first.`);
    }
    
    console.log('\n' + '='.repeat(80));
    
    return {
      overall,
      totalDuration,
      results: this.results,
      timestamp: new Date().toISOString()
    };
  }

  async saveResults(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `oauth-ux-comprehensive-report-${timestamp}.json`;
    
    const detailedReport = {
      ...report,
      testConfiguration: {
        baseUrl: this.baseUrl,
        iterations: this.iterations,
        concurrentSessions: this.concurrentSessions
      },
      rawResults: {
        continuous: this.results.continuous,
        stress: this.results.stress,
        edgeCase: this.results.edgeCase
      }
    };
    
    fs.writeFileSync(filename, JSON.stringify(detailedReport, null, 2));
    await this.log(`📄 Comprehensive report saved to: ${filename}`);
    
    // Also save a summary for quick reference
    const summaryFilename = 'oauth-ux-summary.json';
    const summary = {
      timestamp: new Date().toISOString(),
      grade: report.overall.grade,
      score: report.overall.score,
      description: report.overall.description,
      breakdown: report.overall.breakdown,
      duration: Math.round(report.totalDuration / 1000)
    };
    
    fs.writeFileSync(summaryFilename, JSON.stringify(summary, null, 2));
    await this.log(`📊 Summary saved to: ${summaryFilename}`);
    
    return filename;
  }

  async run() {
    try {
      await this.log('🎯 Starting Master OAuth UX Test Suite...', 'header');
      await this.log(`Configuration: ${this.iterations} iterations, ${this.concurrentSessions} concurrent sessions`);
      await this.log(`Target URL: ${this.baseUrl}`);
      
      // Run all test suites
      await this.runContinuousAuthTests();
      await this.runStressTests();
      await this.runEdgeCaseTests();
      
      // Generate comprehensive report
      const report = this.generateComprehensiveReport();
      
      // Save results
      await this.saveResults(report);
      
      await this.log('🎉 Master OAuth UX Test Suite Complete!', 'success');
      
      return report;
      
    } catch (error) {
      await this.log(`❌ Master test suite failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3001';
  const iterations = parseInt(process.argv[3]) || 10; // Reduced for demo
  const concurrentSessions = parseInt(process.argv[4]) || 2;
  
  const runner = new MasterOAuthTestRunner({
    baseUrl,
    iterations,
    concurrentSessions
  });
  
  runner.run()
    .then(report => {
      // Exit with success if grade is B+ or higher
      const successGrades = ['A+', 'A', 'B+'];
      process.exit(successGrades.includes(report.overall.grade) ? 0 : 1);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = MasterOAuthTestRunner;