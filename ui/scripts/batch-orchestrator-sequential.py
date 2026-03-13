#!/usr/bin/env python3
"""
Batch Orchestrator (Sequential)
Runs Auto-Reviser/Fixer pipeline across 1-4 batches sequentially
Collects evidence and generates batch reports

Usage:
  python batch-orchestrator-sequential.py --batch 1          # Test Batch 1 only
  python batch-orchestrator-sequential.py --batch 1,2        # Batch 1 and 2
  python batch-orchestrator-sequential.py --all              # All batches 1-4
  python batch-orchestrator-sequential.py --test             # Dry-run, no fixes
"""

import json
import subprocess
import sys
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
from auto_reviser_fixer import AutoReviserFixer

class BatchOrchestrator:
    """Sequential batch orchestrator for Auto-Reviser/Fixer pipeline"""
    
    # Batch definitions: Layer names grouped by batch
    BATCHES = {
        1: [
            'projects', 'wbs', 'sprints', 'stories', 'tasks',
            'evidence', 'verification_records', 'quality_gates',
            'project_work', 'sprint_tracking', 'task_tracking',
            'agent_policies', 'prompt_definitions', 'model_configs',
            'security_controls', 'compliance_audit', 'risk_items',
            'decisions', 'deployment_records', 'performance_metrics',
        ],
        2: [
            'components', 'api_endpoints', 'data_models', 'services',
            'hooks', 'context_providers', 'utilities', 'constants',
            'schemas', 'types', 'interfaces', 'enums',
            'validators', 'transformers', 'repositories', 'clients',
            'middleware', 'handlers', 'helpers', 'formatters',
            'parsers', 'builders', 'factories', 'mappers',
            'adapters', 'decorators', 'guards', 'interceptors',
            'middleware_auth', 'middleware_logging', 'middleware_error',
            'middleware_cache', 'middleware_rate_limit', 'plugins',
            'extensions', 'integrations', 'connectors', 'gateways',
            'proxies', 'bridges', 'facades', 'strategies',
        ],
        3: [
            'infrastructure_code', 'terraform_modules', 'bicep_templates',
            'docker_configs', 'kubernetes_manifests', 'monitoring_dashboards',
            'alert_rules', 'backup_policies', 'disaster_recovery',
            'load_balancer_config', 'dns_records', 'cdn_rules',
            'firewall_rules', 'network_policies', 'vpn_config',
            'ssl_certificates', 'secrets_management', 'key_vault_setup',
            'iam_policies', 'rbac_roles', 'audit_logging',
            'compliance_policies', 'data_retention', 'encryption_config',
            'replication_setup', 'failover_config', 'scaling_policies',
            'cost_optimization', 'performance_tuning', 'observability_setup',
            'distributed_tracing', 'log_aggregation', 'metrics_collection',
        ],
        4: [
            'strategy_roadmap', 'vision_statement', 'goals_objectives',
            'kpis', 'success_metrics', 'risk_mitigation',
            'contingency_plans', 'stakeholder_management', 'communication_plan',
            'change_management', 'training_plan', 'adoption_strategy',
            'vendor_management', 'partnership_strategy', 'market_analysis',
            'competitive_analysis', 'innovation_pipeline', 'technical_debt_backlog',
            'architecture_evolution', 'technology_refresh_plan', 'modernization_roadmap',
            'customer_feedback_loop', 'metrics_review_cadence', 'strategic_planning',
        ],
    }
    
    def __init__(self, ui_root: Path = None, dry_run: bool = False):
        self.ui_root = ui_root or Path('C:/eva-foundry/37-data-model/ui')
        self.dry_run = dry_run
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.session = {
            'orchestrator_version': '1.0.0',
            'start_time': datetime.now().isoformat(),
            'batches': {},
            'summary': {}
        }
        self.evidence_dir = self.ui_root.parent / 'evidence'
        self.evidence_dir.mkdir(parents=True, exist_ok=True)
    
    def log(self, level: str, message: str):
        """Log with timestamp"""
        ts = datetime.now().strftime('%H:%M:%S')
        prefix = f"[{level:5s}] [{ts}]"
        print(f"{prefix} {message}")
    
    def run_batch(self, batch_num: int) -> Dict:
        """Run pipeline for all layers in a batch"""
        layers = self.BATCHES.get(batch_num, [])
        if not layers:
            self.log('ERROR', f"Batch {batch_num} not defined")
            return {'status': 'error', 'batch': batch_num}
        
        self.log('SECTION', f'{"="*70}')
        self.log('SECTION', f'BATCH {batch_num}: {len(layers)} layers')
        self.log('SECTION', f'{"="*70}')
        
        batch_result = {
            'batch': batch_num,
            'layers': len(layers),
            'layer_results': [],
            'timestamp': datetime.now().isoformat(),
            'start_time': datetime.now().isoformat(),
            'metrics': {
                'passed': 0,
                'failed': 0,
                'total_fixes': 0,
                'total_mti_score': 0,
                'avg_mti_score': 0,
            }
        }
        
        for idx, layer_name in enumerate(layers, 1):
            self.log('INFO', f'[{idx}/{len(layers)}] Processing layer: {layer_name}')
            
            if self.dry_run:
                self.log('WARN', f'DRY-RUN: Would process {layer_name}')
                layer_result = {
                    'layer': layer_name,
                    'status': 'dry_run',
                    'fixes': 0,
                    'mti_score': 0
                }
            else:
                # Run the auto-reviser pipeline
                pipeline = AutoReviserFixer(
                    ui_root=self.ui_root,
                    layer_name=layer_name,
                    batch_num=batch_num
                )
                success = pipeline.run()
                
                # Extract results from session
                fixes_count = pipeline.session.get('phases', {}).get('fix', {}).get('total', 0)
                verify_score = pipeline.session.get('phases', {}).get('verify', {}).get('metrics', {}).get('mti_score', 0)
                
                layer_result = {
                    'layer': layer_name,
                    'status': 'pass' if success else 'fail',
                    'fixes': fixes_count,
                    'mti_score': verify_score,
                    'session_file': f"auto-reviser_{layer_name}_{self.timestamp}.json"
                }
                
                if success:
                    batch_result['metrics']['passed'] += 1
                    self.log('OK', f'{layer_name}: {fixes_count} fixes, MTI {verify_score}')
                else:
                    batch_result['metrics']['failed'] += 1
                    self.log('WARN', f'{layer_name}: FAILED')
            
            batch_result['layer_results'].append(layer_result)
            batch_result['metrics']['total_fixes'] += layer_result['fixes']
            batch_result['metrics']['total_mti_score'] += layer_result['mti_score']
        
        # Calculate batch metrics
        passed = batch_result['metrics']['passed']
        if (passed + batch_result['metrics']['failed']) > 0:
            batch_result['metrics']['avg_mti_score'] = (
                batch_result['metrics']['total_mti_score'] / (passed + batch_result['metrics']['failed'])
            )
        
        batch_result['end_time'] = datetime.now().isoformat()
        batch_result['status'] = 'pass' if batch_result['metrics']['failed'] == 0 else 'warn'
        
        self.log('SECTION', f'BATCH {batch_num} SUMMARY')
        self.log('INFO', f"Passed: {batch_result['metrics']['passed']}/{len(layers)}")
        self.log('INFO', f"Total fixes: {batch_result['metrics']['total_fixes']}")
        self.log('INFO', f"Avg MTI score: {batch_result['metrics']['avg_mti_score']:.1f}")
        
        return batch_result
    
    def run_batches(self, batch_numbers: List[int]) -> Dict:
        """Run multiple batches sequentially"""
        self.log('SECTION', f'BATCH ORCHESTRATOR v1.0.0 - Sequential Mode')
        self.log('INFO', f'Running {len(batch_numbers)} batch(es) sequentially')
        
        total_layers = sum(len(self.BATCHES.get(b, [])) for b in batch_numbers)
        self.log('INFO', f'Total layers to process: {total_layers}')
        
        for batch_num in batch_numbers:
            batch_result = self.run_batch(batch_num)
            self.session['batches'][f'batch_{batch_num}'] = batch_result
        
        # Generate summary
        self.generate_summary(batch_numbers)
        
        return self.session
    
    def generate_summary(self, batch_numbers: List[int]):
        """Generate overall summary"""
        self.log('SECTION', f'{"="*70}')
        self.log('SECTION', 'OVERALL SUMMARY')
        self.log('SECTION', f'{"="*70}')
        
        total_layers = 0
        total_passed = 0
        total_failed = 0
        total_fixes = 0
        total_mti = 0.0
        all_mti_scores = []
        
        for batch_num in batch_numbers:
            batch_key = f'batch_{batch_num}'
            if batch_key in self.session['batches']:
                batch = self.session['batches'][batch_key]
                metrics = batch.get('metrics', {})
                
                total_layers += batch['layers']
                total_passed += metrics.get('passed', 0)
                total_failed += metrics.get('failed', 0)
                total_fixes += metrics.get('total_fixes', 0)
                total_mti += metrics.get('total_mti_score', 0)
                
                # Collect individual scores
                for result in batch.get('layer_results', []):
                    if result.get('mti_score'):
                        all_mti_scores.append(result['mti_score'])
        
        avg_mti = total_mti / max(total_passed + total_failed, 1)
        
        self.session['summary'] = {
            'total_batches': len(batch_numbers),
            'total_layers': total_layers,
            'passed': total_passed,
            'failed': total_failed,
            'pass_rate': f"{(total_passed/total_layers*100):.1f}%" if total_layers > 0 else "0%",
            'total_fixes': total_fixes,
            'avg_mti_score': f"{avg_mti:.1f}",
            'fixes_per_layer': f"{(total_fixes/total_layers):.0f}" if total_layers > 0 else "0",
            'cost_savings_usd': self.calc_cost_savings(total_layers),
            'time_saved_hours': self.calc_time_saved(total_layers),
        }
        
        self.log('INFO', f"Total layers: {total_layers}")
        self.log('INFO', f"Passed: {total_passed} | Failed: {total_failed}")
        self.log('INFO', f"Pass rate: {self.session['summary']['pass_rate']}")
        self.log('INFO', f"Total fixes: {total_fixes}")
        self.log('INFO', f"Avg MTI score: {self.session['summary']['avg_mti_score']}")
        self.log('INFO', f"Fixes per layer: {self.session['summary']['fixes_per_layer']}")
        self.log('INFO', f"Cost savings: ${self.session['summary']['cost_savings_usd']}")
        self.log('INFO', f"Time saved: {self.session['summary']['time_saved_hours']} hours")
        
        self.session['end_time'] = datetime.now().isoformat()
    
    def calc_cost_savings(self, layers: int) -> str:
        """Calculate cost savings (37 hours manual at $150/hr reduced to pipeline)"""
        manual_hours = layers * 0.18  # 20 min per layer = 0.33 hours (est 18 min with automation)
        automated_hours = layers * 0.025  # 1.5 min per layer (90 sec)
        
        manual_cost = manual_hours * 150
        automated_cost = automated_hours * 75
        
        savings = manual_cost - automated_cost
        return f"${savings:,.0f}"
    
    def calc_time_saved(self, layers: int) -> str:
        """Calculate time saved"""
        manual_hours = layers * 0.18
        automated_hours = layers * 0.025
        
        saved = manual_hours - automated_hours
        return f"{saved:.1f}"
    
    def save_session(self):
        """Save orchestrator session to JSON"""
        output_file = self.evidence_dir / f"batch-orchestrator_{self.timestamp}.json"
        
        with open(output_file, 'w') as f:
            json.dump(self.session, f, indent=2)
        
        self.log('OK', f"Session saved: {output_file}")
        return output_file
    
    def run(self, batch_numbers: List[int]):
        """Main entry point"""
        try:
            self.run_batches(batch_numbers)
            self.save_session()
            
            self.log('SECTION', 'ORCHESTRATOR COMPLETE')
            return 0
        except Exception as e:
            self.log('ERROR', f"Orchestrator failed: {e}")
            return 1

def main():
    parser = argparse.ArgumentParser(
        description='Batch Orchestrator for Auto-Reviser/Fixer Pipeline'
    )
    parser.add_argument(
        '--batch',
        type=str,
        default='1',
        help='Batch number(s) to run: 1,2,3,4 or 1 (default: 1)'
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Run all batches 1-4'
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help='Dry-run: show what would happen without making changes'
    )
    parser.add_argument(
        '--ui-root',
        type=str,
        default='C:/eva-foundry/37-data-model/ui',
        help='UI root directory'
    )
    
    args = parser.parse_args()
    
    # Parse batch numbers
    if args.all:
        batch_numbers = [1, 2, 3, 4]
    else:
        batch_numbers = [int(b.strip()) for b in args.batch.split(',')]
    
    # Validate batch numbers
    for b in batch_numbers:
        if b not in [1, 2, 3, 4]:
            print(f"ERROR: Invalid batch number {b}. Must be 1-4")
            return 1
    
    # Run orchestrator
    orchestrator = BatchOrchestrator(
        ui_root=Path(args.ui_root),
        dry_run=args.test
    )
    
    return orchestrator.run(batch_numbers)

if __name__ == '__main__':
    sys.exit(main())
