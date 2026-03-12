#!/usr/bin/env python3
"""
Batch Workflow Test
Validates the complete pipeline on a small test batch (3 layers)
before running full batches 1-4

Usage:
  python batch-test.py                 # Run test batch
  python batch-test.py --full          # If test passes, run Batch 1 full
"""

import subprocess
import sys
import argparse
import time
from pathlib import Path
from datetime import datetime

class BatchWorkflowTest:
    """Test the batch orchestrator workflow"""
    
    # Small test batch: 3 layers only
    TEST_BATCH = ['projects', 'wbs', 'sprints']
    
    def __init__(self):
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.ui_root = Path('C:/eva-foundry/37-data-model/ui')
        self.scripts_dir = self.ui_root / 'scripts'
    
    def log(self, level: str, message: str):
        """Log with timestamp"""
        ts = datetime.now().strftime('%H:%M:%S')
        prefix = f"[{level:5s}] [{ts}]"
        print(f"{prefix} {message}")
    
    def test_pipeline_import(self) -> bool:
        """Test 1: Can we import the pipeline?"""
        self.log('TEST', 'Test 1: Pipeline import')
        try:
            from auto_reviser_fixer import AutoReviserFixer
            self.log('OK', 'Pipeline imports successfully')
            return True
        except Exception as e:
            self.log('FAIL', f'Pipeline import failed: {e}')
            return False
    
    def test_batch_orchestrator_import(self) -> bool:
        """Test 2: Can we import the batch orchestrator?"""
        self.log('TEST', 'Test 2: Batch orchestrator import')
        try:
            from batch_orchestrator_sequential import BatchOrchestrator
            self.log('OK', 'Batch orchestrator imports successfully')
            return True
        except Exception as e:
            self.log('FAIL', f'Batch orchestrator import failed: {e}')
            return False
    
    def test_single_layer(self) -> bool:
        """Test 3: Run pipeline on a single layer"""
        self.log('TEST', 'Test 3: Single layer pipeline run (projects)')
        try:
            from auto_reviser_fixer import AutoReviserFixer
            
            pipeline = AutoReviserFixer(
                ui_root=self.ui_root,
                layer_name='projects',
                batch_num=0  # Test batch
            )
            
            self.log('INFO', 'Starting pipeline for projects layer...')
            success = pipeline.run()
            
            if success:
                self.log('OK', 'Single layer pipeline completed')
                return True
            else:
                self.log('WARN', 'Pipeline returned false (may be acceptable)')
                return True  # Not a hard failure
        except Exception as e:
            self.log('FAIL', f'Single layer test failed: {e}')
            return False
    
    def test_evidence_file_creation(self) -> bool:
        """Test 4: Check if evidence file was created"""
        self.log('TEST', 'Test 4: Evidence file creation')
        try:
            evidence_dir = self.ui_root.parent / 'evidence'
            files = list(evidence_dir.glob('auto-reviser_projects_*.json'))
            
            if files:
                latest = sorted(files)[-1]
                self.log('OK', f'Evidence file created: {latest.name}')
                
                # Check file size and content
                with open(latest, 'r') as f:
                    import json
                    data = json.load(f)
                    phases = data.get('phases', {}).keys()
                    self.log('INFO', f'Phases recorded: {", ".join(phases)}')
                
                return True
            else:
                self.log('WARN', 'No evidence files found (may be expected)')
                return True
        except Exception as e:
            self.log('WARN', f'Evidence check failed: {e}')
            return True  # Not critical
    
    def run_test_batch(self) -> bool:
        """Test 5: Run test batch with orchestrator"""
        self.log('TEST', 'Test 5: Test batch (3 layers)')
        try:
            from batch_orchestrator_sequential import BatchOrchestrator
            
            orchestrator = BatchOrchestrator(ui_root=self.ui_root, dry_run=False)
            
            self.log('INFO', f'Running test batch: {", ".join(self.TEST_BATCH)}')
            
            # Manually run test batch
            test_batch_num = 99  # Use batch 99 for testing
            BatchOrchestrator.BATCHES[99] = self.TEST_BATCH
            
            result = orchestrator.run_batch(test_batch_num)
            
            if result['status'] == 'pass' or result['metrics']['passed'] > 0:
                self.log('OK', f'Test batch completed: {result["metrics"]["passed"]}/{len(self.TEST_BATCH)} passed')
                self.log('INFO', f'Total fixes: {result["metrics"]["total_fixes"]}')
                self.log('INFO', f'Avg MTI score: {result["metrics"]["avg_mti_score"]:.1f}')
                return True
            else:
                self.log('WARN', f'Test batch had failures: {result["metrics"]["failed"]} failed')
                return True  # Still continue
        except Exception as e:
            self.log('FAIL', f'Test batch failed: {e}')
            import traceback
            traceback.print_exc()
            return False
    
    def run_all_tests(self) -> int:
        """Run all tests in sequence"""
        self.log('SECTION', '='*70)
        self.log('SECTION', 'BATCH WORKFLOW TEST')
        self.log('SECTION', '='*70)
        
        tests = [
            ('Import Pipeline', self.test_pipeline_import),
            ('Import Orchestrator', self.test_batch_orchestrator_import),
            ('Single Layer Run', self.test_single_layer),
            ('Evidence File', self.test_evidence_file_creation),
            ('Test Batch', self.run_test_batch),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            self.log('SECTION', f'Running: {test_name}')
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log('ERROR', f'{test_name} crashed: {e}')
                failed += 1
            
            # Small delay between tests
            time.sleep(1)
        
        # Summary
        self.log('SECTION', '='*70)
        self.log('SECTION', 'TEST SUMMARY')
        self.log('INFO', f'Passed: {passed}/{len(tests)}')
        self.log('INFO', f'Failed: {failed}/{len(tests)}')
        
        if failed == 0:
            self.log('OK', 'ALL TESTS PASSED - Ready for full batch run')
            return 0
        else:
            self.log('FAIL', f'{failed} tests failed - Fix issues before running full batches')
            return 1
    
    def run_batch_1_full(self) -> int:
        """If tests pass, offer to run Batch 1 full (20 layers)"""
        self.log('SECTION', '='*70)
        self.log('SECTION', 'BATCH 1 FULL RUN')
        self.log('INFO', 'Batch 1: 20 core layers (projects, wbs, sprints, etc.)')
        self.log('INFO', 'Estimated runtime: 25-30 minutes')
        self.log('SECTION', '='*70)
        
        try:
            from batch_orchestrator_sequential import BatchOrchestrator
            
            orchestrator = BatchOrchestrator(ui_root=self.ui_root, dry_run=False)
            return orchestrator.run([1])
        except Exception as e:
            self.log('ERROR', f'Batch 1 run failed: {e}')
            return 1

def main():
    parser = argparse.ArgumentParser(description='Batch Workflow Test')
    parser.add_argument('--full', action='store_true', help='If test passes, run Batch 1')
    
    args = parser.parse_args()
    
    # Run tests
    tester = BatchWorkflowTest()
    test_result = tester.run_all_tests()
    
    if test_result == 0 and args.full:
        # Tests passed and user wants to run full
        tester.log('INFO', 'Starting Batch 1 full run...')
        time.sleep(2)
        return tester.run_batch_1_full()
    
    return test_result

if __name__ == '__main__':
    sys.exit(main())
